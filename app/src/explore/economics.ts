import { EconomicsInputsSchema } from './schema';
import type { z } from 'zod';
export type EconomicsInputs = z.infer<typeof EconomicsInputsSchema>;
// All money is calculated in cents. This is an agency marketplace: GMV belongs to the merchant.
export function calculateEconomics(raw: EconomicsInputs) {
  const input = EconomicsInputsSchema.parse(raw);
  const cents = (v: number) => Math.round(v * 100);
  const order = cents(input.orderValue), product = cents(input.productCost), logistics = cents(input.logistics);
  const delivery = cents(input.delivery), operating = cents(input.operating);
  const revenue = Math.round(order * input.takeRate / 100);
  const merchantGross = order - product - logistics - revenue;
  return { order: order / 100, product: product / 100, logistics: logistics / 100, delivery: delivery / 100, operating: operating / 100,
    customerTotal: (order + delivery) / 100, revenue: revenue / 100, merchantGross: merchantGross / 100,
    platformContribution: (revenue - operating) / 100, merchantMargin: order ? merchantGross / order * 100 : null };
}
