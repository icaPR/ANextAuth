import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";

let cookies = parseCookies();
let isRefreshing = false;
let failedRequesQueue = [];

interface AxiosErrorResponse {
  code?: string;
}

export const api = axios.create({
  baseURL: "http://localhost:3333",
});
api.defaults.headers.common.Authorization = `Bearer ${cookies["nextauth.token"]}`;

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<AxiosErrorResponse>) => {
    if (error.response.status === 401) {
      if (error.response.data.code === "token.expired") {
        cookies = parseCookies();

        const { "nextauth.refreshToken": refreshToken } = cookies;
        const originalConfig = error.config;

        if (!isRefreshing) {
          isRefreshing = true;
          console.log("Passo1");
          api
            .post("/refresh", {
              refreshToken,
            })
            .then((response) => {
              console.log("Passo2");
              const { token } = response.data;

              setCookie(undefined, "nextauth.token", token, {
                maxAge: 60 * 60 * 24 * 30,
                path: "/",
              });
              setCookie(
                undefined,
                "nextauth.refreshToken",
                response.data.refreshToken,
                {
                  maxAge: 60 * 60 * 24 * 30,
                  path: "/",
                }
              );
              // api.defaults.headers["Authorization"] = `Bearer ${token}`;

              failedRequesQueue.forEach((request) => request.onSuccess(token));
              failedRequesQueue = [];
            })
            .catch((err) => {
              failedRequesQueue.forEach((request) => request.onFailure(err));
              failedRequesQueue = [];
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        return new Promise((resolve, reject) => {
          failedRequesQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers["Authorization"] = `Bearer ${token}`;
              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      } else {
        //signOut();
      }
    }
    return Promise.reject(error);
  }
);
