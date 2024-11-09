/// <reference types="vite/client" />
declare interface Window {
  __biz__fetch__: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  __mapCtrl__: any;
}
