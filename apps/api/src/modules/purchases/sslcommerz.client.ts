import { loadEnv } from "../../config/env.js";
import { AppError } from "../../common/errors.js";

type InitSessionInput = {
  tranId: string;
  amountBdt: number;
  courseTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
};

type InitSessionResult = {
  gatewayUrl: string;
  sessionKey: string;
};

type ValidateResult = {
  status: string;
  tranId: string;
  amount: string;
  currency: string;
  valId: string;
  raw: Record<string, unknown>;
};

function baseUrl(isLive: boolean) {
  return isLive
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";
}

export function isSslcommerzConfigured() {
  const env = loadEnv();
  return Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD);
}

export async function initSslcommerzSession(
  input: InitSessionInput,
): Promise<InitSessionResult> {
  const env = loadEnv();
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw new AppError(
      503,
      "Online payments are not configured",
      "PAYMENT_NOT_CONFIGURED",
    );
  }

  const body = new URLSearchParams({
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    total_amount: String(input.amountBdt),
    currency: "BDT",
    tran_id: input.tranId,
    success_url: input.successUrl,
    fail_url: input.failUrl,
    cancel_url: input.cancelUrl,
    ipn_url: input.ipnUrl,
    product_name: input.courseTitle.slice(0, 255),
    product_category: "Education",
    product_profile: "general",
    cus_name: input.customerName.slice(0, 50),
    cus_email: input.customerEmail.slice(0, 50),
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: (input.customerPhone || "01700000000").slice(0, 20),
    shipping_method: "NO",
    num_of_item: "1",
  });

  const res = await fetch(`${baseUrl(env.SSLCOMMERZ_IS_LIVE)}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || data.status !== "SUCCESS" || typeof data.GatewayPageURL !== "string") {
    const reason =
      typeof data?.failedreason === "string"
        ? data.failedreason
        : "SSLCommerz session init failed";
    throw new AppError(502, reason, "PAYMENT_GATEWAY_ERROR", data);
  }

  return {
    gatewayUrl: data.GatewayPageURL,
    sessionKey: typeof data.sessionkey === "string" ? data.sessionkey : "",
  };
}

export async function validateSslcommerzPayment(valId: string): Promise<ValidateResult> {
  const env = loadEnv();
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) {
    throw new AppError(
      503,
      "Online payments are not configured",
      "PAYMENT_NOT_CONFIGURED",
    );
  }

  const params = new URLSearchParams({
    val_id: valId,
    store_id: env.SSLCOMMERZ_STORE_ID,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
    format: "json",
  });

  const res = await fetch(
    `${baseUrl(env.SSLCOMMERZ_IS_LIVE)}/validator/api/validationserverAPI.php?${params}`,
  );
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || typeof data.status !== "string") {
    throw new AppError(502, "Payment validation failed", "PAYMENT_VALIDATION_FAILED", data);
  }

  return {
    status: data.status,
    tranId: String(data.tran_id ?? ""),
    amount: String(data.amount ?? ""),
    currency: String(data.currency ?? "BDT"),
    valId: String(data.val_id ?? valId),
    raw: data,
  };
}
