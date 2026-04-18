import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, X, CheckCircle, Barcode, Share2, Receipt as ReceiptIcon, Activity, QrCode, Smartphone } from "lucide-react";
import JsBarcode from "jsbarcode";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          lineColor: "#FB923C",
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
    const message = `*Lumiaxy Enterprise Receipt*\n\nRegistry: ${data.receiptNo}\nDate: ${data.date}\nTotal: KES ${data.total.toLocaleString()}\n\nThank you for trusting our clinical network!`;
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
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 360px; margin: 0 auto; color: #000; font-size: 13px; font-weight: bold; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #999; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; padding: 2px 0; }
          .item-name { font-size: 11px; text-transform: uppercase; font-weight: bold; }
          .header { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
          .sub { font-size: 10px; color: #444; letter-spacing: 1px; line-height: 1.4; text-transform: uppercase; }
          .total-row { font-size: 16px; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 8px 0; }
          .footer { font-size: 9px; color: #666; margin-top: 16px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="header">LUMIAXY ENTERPRISE</div>
          <div class="sub">DISTRIBUTED CLINICAL NETWORK</div>
          <div class="sub">NODE ID: ${data.receiptNo.slice(0, 8)}</div>
          <div class="sub">KRA PIN: P0512XXXXXXXXX</div>
        </div>
        <div class="divider"></div>
        <div class="row"><span>REGISTRY #</span><span class="bold">${data.receiptNo}</span></div>
        <div class="row"><span>SYNC TIME</span><span>${data.date} ${data.time}</span></div>
        <div class="row"><span>DISPENSER</span><span>${data.sellerName}</span></div>
        ${data.customerName ? `<div class="row"><span>CLIENT</span><span>${data.customerName}</span></div>` : ""}
        <div class="divider"></div>
        <div class="bold" style="margin-bottom:6px">MEDICATION DISPENSED:</div>
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
          <span>SUBTOTAL</span>
          <span>KES ${data.subtotal.toLocaleString()}</span>
        </div>
        ${data.taxAmount > 0 ? `
          <div class="row">
            <span>VAT COMPLIANCE (16%)</span>
            <span>KES ${data.taxAmount.toLocaleString()}</span>
          </div>
        ` : ""}
        ${data.discount > 0 ? `
          <div class="row">
            <span>SPECIAL PROVISION</span>
            <span>- KES ${data.discount.toLocaleString()}</span>
          </div>
        ` : ""}
        <div class="total-row">
          <div class="row">
            <span>FINAL REMITTANCE</span>
            <span>KES ${data.total.toLocaleString()}</span>
          </div>
        </div>
        <div class="row"><span>METHOD</span><span class="bold">${data.paymentMethod.toUpperCase()}</span></div>
        <div class="divider"></div>
        <div class="center footer">
          <p>LUMIAXY ECOSYSTEM • PROFESSIONAL PARTNER</p>
          <div id="print-barcode" style="margin: 10px 0; display: flex; justify-content: center;"></div>
          <p>PPB Licensed • No Returns Accepted</p>
          <p style="margin-top:8px; font-weight:bold">*** SECURED DIGITAL LEDGER RECORD ***</p>
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

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://lumiaxy.ph/verify/${data.receiptNo}&color=FB923C&bgcolor=0B0E14`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#0B0E14] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-3xl animate-print">
        <Tabs defaultValue="thermal" className="w-full">
          {/* Success Header */}
          <div className="p-10 text-center border-b border-white/5 bg-white/[0.02]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/30 mb-6 shadow-2xl shadow-primary/20">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">Authorization Complete</h2>
            <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.4em]">Registry ID: {data.receiptNo}</p>
            
            <TabsList className="mt-8 bg-white/5 h-12 p-1 rounded-2xl border border-white/5">
              <TabsTrigger value="thermal" className="rounded-xl px-6 font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black">
               <ReceiptIcon className="mr-2 h-3.5 w-3.5" /> Thermal View
              </TabsTrigger>
              <TabsTrigger value="digital" className="rounded-xl px-6 font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black">
                <QrCode className="mr-2 h-3.5 w-3.5" /> Digital Receipt
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="thermal" className="m-0">
             {/* Receipt Body */}
            <div className="p-8 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Network Timestamp</p>
                  <p className="text-xs text-white font-bold">{data.date} • {data.time}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Auth. Node</p>
                  <p className="text-xs text-white font-bold">{data.sellerName}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-4 italic">Itemized Dispensation</p>
                {data.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5 transition-all hover:bg-white/10">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-white italic truncate flex items-center gap-2">
                        {item.name}
                        {item.is_taxable && <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] px-1 h-3 font-black">VAT</Badge>}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-muted-foreground font-bold tracking-tight uppercase">{item.quantity} units @ KES {item.unit_price.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="font-black text-white tabular-nums pl-4 text-sm italic">KES {item.total_price.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                  <span>Gross Subtotal</span>
                  <span>KES {data.subtotal.toLocaleString()}</span>
                </div>
                {data.taxAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-primary/80 font-black uppercase tracking-widest">
                    <span>VAT Compliance (16%)</span>
                    <span>+ KES {data.taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {data.discount > 0 && (
                  <div className="flex justify-between text-[10px] text-primary font-black uppercase tracking-widest">
                    <span>Special Provision</span>
                    <span>- KES {data.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-6 mt-2 border-t border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Final Remittance</p>
                      <p className="text-[10px] text-primary font-black uppercase italic tracking-widest">{data.paymentMethod} Confirmed</p>
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter shadow-primary glow-primary">KES {data.total.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-col items-center pt-8 border-t border-dashed border-white/20">
                <svg ref={barcodeRef} className="max-w-full"></svg>
                <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.5em]">
                  <Barcode className="h-4 w-4" /> SECURE SIGNATURE
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="digital" className="m-0 p-12 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500">
             <div className="relative p-6 rounded-[3rem] bg-white/[0.02] border border-white/10 shadow-3xl group">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all" />
                <img 
                  src={qrUrl} 
                  alt="Digital Receipt QR" 
                  className="relative z-10 w-64 h-64 rounded-2xl border-4 border-[#0B0E14] shadow-2xl"
                />
             </div>
             <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-1">
                   <Smartphone size={14} /> Contactless Delivery
                </div>
                <p className="text-muted-foreground font-bold text-sm max-w-[280px]">Scan this code with a mobile device to access the secured e-receipt registry.</p>
             </div>
             <Button onClick={() => toast.success("Public verification link copied!")} variant="outline" className="h-14 w-full rounded-2xl border-white/10 text-white font-black uppercase text-[9px] tracking-widest hover:bg-white/5">
                Copy Cloud Link
             </Button>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="p-10 border-t border-white/5 bg-white/[0.04] grid grid-cols-3 gap-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-16 rounded-2xl text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest bg-white/5"
          >
            Conclude
          </Button>
          <Button
            variant="outline"
            onClick={handleWhatsAppShare}
            className="h-16 rounded-2xl border-green-500/20 text-green-500 hover:bg-green-500/10 font-black uppercase text-[10px] tracking-widest"
          >
            <Share2 className="mr-3 h-4 w-4" />
            Transfer
          </Button>
          <Button
            onClick={handlePrint}
            className="h-16 rounded-2xl shadow-3xl shadow-primary/30 font-black bg-primary text-black hover:bg-primary/90 uppercase text-[10px] tracking-[0.2em]"
          >
            <Printer className="mr-3 h-5 w-5" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
