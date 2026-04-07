import Stripe from "stripe";
import { envSchema } from "./env";

export const stripe = new Stripe(envSchema.STRIPE_SECRET_KEY);
