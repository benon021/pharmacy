import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, X, CheckCircle, Barcode, Share2, Receipt as ReceiptIcon, Activity } from "lucide-react";
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  batch_number?: string;
  is_taxable?: boolean;
}

interface ReceiptData {
  receiptNo: string;
  date: string;
  time: string;
  sellerName: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export default function ReceiptModal({ open, onClose, data }: ReceiptModalProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (open && data && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, data.receiptNo, {
          format: "CODE128",
          width: 1.2,
          height: 30,
          displayValue: false,
          margin: 0,
          background: "transparent",
          lineColor: "#10b981",
        });
      } catch (err) {
        console.error("Barcode generation failed", err);
      }
    }
  }, [open, data]);

  if (!data) return null;

  const handleWhatsAppShare = () => {
    if (!data.customerPhone) {
      toast.error("No customer phone number available for sharing");
      return;
    }
    const cleanPhone = data.customerPhone.replace(/[^0-9]/g, "");
    const message = `*Kenya Rx Flow Receipt*\n\nReceipt: ${data.receiptNo}\nDate: ${data.date}\nTotal: KES ${data.total.toLocaleString()}\n\nThank you for your business!`;
    const url = `https://wa.me/${cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${data.receiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 360px; margin: 0 auto; color: #000; font-size: 13px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #999; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; }
          .item-name { font-size: 11px; text-transform: uppercase; font-weight: bold; }
          .header { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
          .sub { font-size: 10px; color: #444; letter-spacing: 1px; line-height: 1.4; }
          .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 8px 0; }
          .footer { font-size: 9px; color: #666; margin-top: 16px; }
          .badge { font-size: 9px; background: #eee; padding: 1px 3px; border: 1px solid #ddd; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="header">KENYA RX FLOW</div>
          <div class="sub">PROFESSIONAL PHARMACY PARTNER</div>
          <div class="sub">KRA PIN: P0512XXXXXXXXX</div>
          <div class="sub">Nairobi, Kenya · +254 7XX XXX XXX</div>
        </div>
        <div class="divider"></div>
        <div class="row"><span>INVOICE #</span><span class="bold">${data.receiptNo}</span></div>
        <div class="row"><span>DATE/TIME</span><span>${data.date} ${data.time}</span></div>
        <div class="row"><span>CASHIER</span><span>${data.sellerName}</span></div>
        ${data.customerName ? `<div class="row"><span>CUSTOMER</span><span>${data.customerName}</span></div>` : ""}
        <div class="divider"></div>
        <div class="bold" style="margin-bottom:6px">ITEMIZED BILL:</div>
        ${data.items.map(item => `
          <div class="item-name">${item.name} ${item.is_taxable ? '*' : ''}</div>
          <div class="row" style="padding-left:10px">
             <span style="font-size:10px">Batch: ${item.batch_number || 'N/A'}</span>
             <span>${item.quantity} x KES ${item.unit_price.toLocaleString()}</span>
          </div>
          <div class="row" style="padding-left:10px">
             <span></span>
             <span class="bold">KES ${item.total_price.toLocaleString()}</span>
          </div>
        `).join("")}
        <div class="divider"></div>
        <div class="row">
          <span>Subtotal Excl. Tax</span>
          <span>KES ${data.subtotal.toLocaleString()}</span>
        </div>
        ${data.taxAmount > 0 ? `
          <div class="row">
            <span>VAT Compliance (16%)</span>
            <span>KES ${data.taxAmount.toLocaleString()}</span>
          </div>
        ` : ""}
        ${data.discount > 0 ? `
          <div class="row">
            <span>Professional Discount</span>
            <span>- KES ${data.discount.toLocaleString()}</span>
          </div>
        ` : ""}
        <div class="total-row">
          <div class="row">
            <span>FINAL TOTAL</span>
            <span>KES ${data.total.toLocaleString()}</span>
          </div>
        </div>
        <div class="row"><span>Payment Method</span><span class="bold">${data.paymentMethod.toUpperCase()}</span></div>
        <div class="divider"></div>
        <div class="center footer">
          <p>Items marked (*) attract 16% VAT</p>
          <div id="print-barcode" style="margin: 10px 0; display: flex; justify-content: center;"></div>
          <p>PPB Licensed • Licensed Pharmacist on Duty</p>
          <p>Strictly no returns on medical items once dispensed</p>
          <p style="margin-top:8px; font-weight:bold">*** VALID RECEIPTS ARE BLUE-BACKED ***</p>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        <script>
          JsBarcode("#print-barcode", "${data.receiptNo}", {
            format: "CODE128",
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 10
          });
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border dark:border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl animate-print">
        {/* Success Header */}
        <div className="p-8 text-center border-b border-border dark:border-white/5 bg-muted dark:bg-white/[0.02]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/20 border border-primary/30 mb-4 shadow-xl shadow-primary/5">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground dark:text-white italic tracking-tighter">Sale Authorized</h2>
          <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-[0.3em]">Compliance ID: {data.receiptNo}</p>
        </div>

        {/* Receipt Body */}
        <div className="p-8 space-y-6 max-h-[450px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Temporal Log</p>
               <p className="text-xs text-foreground dark:text-white font-bold">{data.date} • {data.time}</p>
             </div>
             <div className="space-y-1 text-right">
               <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Authorized By</p>
               <p className="text-xs text-foreground dark:text-white font-bold">{data.sellerName}</p>
             </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.3em] mb-4">Dispensation Audit</p>
            {data.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-card dark:bg-white/5 border border-border dark:border-white/5 relative group transition-all hover:bg-white/10">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground dark:text-white truncate flex items-center gap-2">
                    {item.name}
                    {item.is_taxable && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] px-1 h-3">VAT</Badge>}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{item.quantity} units @ {item.unit_price.toLocaleString()}</p>
                    <span className="text-[10px] text-muted-foreground opacity-20">|</span>
                    <p className="text-[10px] text-muted-foreground font-mono">B:{item.batch_number || 'N/A'}</p>
                  </div>
                </div>
                <p className="font-black text-foreground dark:text-white tabular-nums pl-4">KES {item.total_price.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-border dark:border-white/10 space-y-3">
             <div className="flex justify-between text-xs text-muted-foreground font-bold">
               <span>Taxable Subtotal</span>
               <span>KES {data.subtotal.toLocaleString()}</span>
             </div>
             {data.taxAmount > 0 && (
               <div className="flex justify-between text-xs text-amber-500/80 font-bold">
                 <span className="flex items-center gap-1.5"><ReceiptIcon className="h-3 w-3" /> VAT Compliance (16%)</span>
                 <span>+ KES {data.taxAmount.toLocaleString()}</span>
               </div>
             )}
             {data.discount > 0 && (
               <div className="flex justify-between text-xs text-primary font-bold">
                 <span>Special Provision</span>
                 <span>- KES {data.discount.toLocaleString()}</span>
               </div>
             )}
             <div className="flex items-center justify-between pt-4 border-t border-border dark:border-white/5">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Final Remittance</p>
                  <p className="text-xs text-primary font-bold uppercase">{data.paymentMethod} Verified</p>
                </div>
                <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter glow-primary">KES {data.total.toLocaleString()}</p>
             </div>
          </div>

          <div className="flex flex-col items-center pt-6 border-t border-dashed border-white/20">
            <svg ref={barcodeRef} className="max-w-full"></svg>
            <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">
              <Barcode className="h-3 w-3" /> Electronic Signature
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">System Integrity Verified</span>
             </div>
             <div className="flex gap-3">
                <span className="text-[8px] font-black text-green-500/50 uppercase">[OK] INV_DED</span>
                <span className="text-[8px] font-black text-green-500/50 uppercase">[OK] LDG_ARC</span>
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-border dark:border-white/5 bg-white/[0.04] grid grid-cols-3 gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-14 rounded-2xl text-muted-foreground hover:text-foreground dark:text-white font-bold bg-card dark:bg-white/5"
          >
            Done
          </Button>
          <Button
            variant="outline"
            onClick={handleWhatsAppShare}
            className="h-14 rounded-2xl border-green-500/20 text-green-500 hover:bg-green-500/10 font-bold"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            onClick={handlePrint}
            className="h-14 rounded-2xl shadow-xl shadow-primary/20 font-black bg-primary text-black hover:bg-primary/90"
          >
            <Printer className="mr-2 h-5 w-5 font-black" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
