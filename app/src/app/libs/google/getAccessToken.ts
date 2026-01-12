import { GoogleAuth } from "google-auth-library";

import { CONSTS } from "@/app/consts";

export async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: [CONSTS.ENDPOINT.GOOGLE.GET_ACCESS_TOKEN],
  });

  const client = await auth.getClient();
  const res = await client.getAccessToken();

  if (!res?.token) {
    throw new Error(CONSTS.MESSAGE.ERROR.FAILED_TO_OBTAIN_ADC_ACCESS_TOKEN);
  }

  return res.token;
}
