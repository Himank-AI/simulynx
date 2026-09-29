declare const SELECT: any
declare const INSERT: any
declare const UPDATE: any
declare const DELETE: any

declare module '@sap/cds' {
  class ApplicationService {
    init(): Promise<void>
    on(event: string, handler: (req: CdsRequest) => unknown): void
  }
  interface CdsRequest {
    data: Record<string, unknown>
    reject(status: number, message: string): never
  }
  interface Cds {
    ApplicationService: typeof ApplicationService
    on(event: string, handler: (...args: any[]) => unknown): void
    run(query: unknown): Promise<any>
    log(name: string): { info(message: string): void }
    ql: Record<string, unknown>
  }
  const cds: Cds
  export default cds
}
