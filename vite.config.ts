import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import axios from "axios";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      {
        name: "mpesa-proxy",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === "/api/mpesa/stkpush" && req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk.toString();
              });

              req.on("end", async () => {
                try {
                  const { phoneNumber, amount } = JSON.parse(body);

                  // 1. Get Access Token
                  const auth = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString("base64");
                  const tokenResponse = await axios.get(
                    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
                    {
                      headers: {
                        Authorization: `Basic ${auth}`,
                      },
                    }
                  );

                  const accessToken = tokenResponse.data.access_token;

                  // 2. Prepare STK Push
                  const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
                  const password = Buffer.from(
                    `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`
                  ).toString("base64");

                  const stkResponse = await axios.post(
                    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
                    {
                      BusinessShortCode: env.MPESA_SHORTCODE,
                      Password: password,
                      Timestamp: timestamp,
                      TransactionType: "CustomerPayBillOnline",
                      Amount: amount,
                      PartyA: phoneNumber.replace("+", ""),
                      PartyB: env.MPESA_SHORTCODE,
                      PhoneNumber: phoneNumber.replace("+", ""),
                      CallBackURL: "https://mydomain.com/path", // This won't work locally but Safaricom needs it
                      AccountReference: "KenyaRxFlow",
                      TransactionDesc: "Medicine Payment",
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify(stkResponse.data));
                } catch (error: any) {
                  console.error("M-Pesa Proxy Error:", error.response?.data || error.message);
                  res.writeHead(error.response?.status || 500, { "Content-Type": "application/json" });
                  res.end(JSON.stringify(error.response?.data || { error: error.message }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
