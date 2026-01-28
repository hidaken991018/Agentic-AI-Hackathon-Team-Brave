import { z } from "zod";

import { lifePlanDefaultValue } from "@/schema/lifePlanJson/lifePlanJsonDefaultValue";

const ChildSchema = z.object({
  name: z.string(),
  age: z.array(z.string()),
});

const NamedSeriesSchema = z.object({
  name: z.string(),
  valueList: z.array(z.string()),
});

export const LifePlanBaseSchema = z.object({
  year: z.array(z.string()),

  user: z.object({
    name: z.string(),
    age: z.array(z.string()),
  }),

  partner: z.object({
    name: z.string(),
    age: z.array(z.string()),
  }),

  children: z.array(ChildSchema),

  lifeEvent: z.array(z.string()),

  income: z.object({
    user: z.array(z.string()),
    partner: z.array(z.string()),
    summary: z.array(z.string()),
  }),

  expenditure: z.object({
    livingExpense: z.object({
      base: z.array(z.string()),
      additional: z.array(NamedSeriesSchema),
    }),
    housingCostList: z.array(z.string()),
    lifeEventCostList: z.array(z.string()),
    educationalExpenses: z.array(NamedSeriesSchema),
    insurancePremium: z.array(NamedSeriesSchema),
    summary: z.array(z.string()),
  }),

  assetManagement: z.object({
    investmentAssets: z.array(z.string()),
    savingInput: z.object({
      planed: z.array(z.string()),
      diff: z.array(z.string()),
    }),
    summary: z.array(z.string()),
  }),

  assets: z.object({
    investmentAssets: z.array(z.string()),
    saving: z.array(z.string()),
    summary: z.array(z.string()),
  }),

  debt: z.object({
    itemList: z.array(NamedSeriesSchema),
    summary: z.array(z.string()),
  }),

  netAssets: z.array(z.string()),
});

/** 型 */
export type LifePlanJsonInput = z.infer<typeof LifePlanBaseSchema>;
export type LifePlanJson = z.infer<typeof LifePlanBaseSchema>;

export const lifePlanJsonSchema =
  LifePlanBaseSchema.default(lifePlanDefaultValue);

export const getDefaultLifePlanSheet = () =>
  LifePlanBaseSchema.parse(undefined);
