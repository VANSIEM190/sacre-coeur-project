/** Minimal declarations for the Deno APIs used by the Edge Function entrypoint. */
declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): unknown
}
