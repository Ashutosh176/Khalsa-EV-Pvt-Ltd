import "reflect-metadata"; // required by class-transformer's @Type() decorator outside of Nest's bootstrap
import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";
import { ListInventoryQuery } from "./list-inventory.query";

// Regression test: found via manual browser testing (curl only ever
// tested omitting lowStockOnly or passing "true"), where the admin
// inventory page sent "?lowStockOnly=false" for the unchecked default
// and got every row filtered out - because @Type(() => Boolean) turns
// the string "false" into `true` (JS: any non-empty string is truthy).
describe("ListInventoryQuery", () => {
  it('treats the literal query string "false" as boolean false', () => {
    const query = plainToInstance(ListInventoryQuery, { lowStockOnly: "false" });
    expect(query.lowStockOnly).toBe(false);
  });

  it('treats the literal query string "true" as boolean true', () => {
    const query = plainToInstance(ListInventoryQuery, { lowStockOnly: "true" });
    expect(query.lowStockOnly).toBe(true);
  });

  it("leaves lowStockOnly undefined (falsy) when the key is omitted entirely", () => {
    const query = plainToInstance(ListInventoryQuery, {});
    expect(query.lowStockOnly).toBeUndefined();
  });
});
