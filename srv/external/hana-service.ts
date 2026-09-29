/**
 * Documents the persistence boundary.
 * CDS is deployed to local SQLite in this prototype. The model itself is HANA Cloud compatible.
 */
export class MockHanaService {
  readonly id = 'MockHanaService'
  readonly system = 'SAP HANA Cloud'
  readonly connected = false
  readonly runtime = 'CAP SQLite'

  describe(): string {
    return 'The CDS model is written for SAP HANA Cloud. This prototype persists through CAP into local SQLite because no HANA Cloud binding is configured. Do not treat the database as a live HR system.'
  }
}
