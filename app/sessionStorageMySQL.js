import { SessionStorage } from "@shopify/shopify-api";
import { mySqlQury } from "../dbMysl";
import { shopifyApi } from "@shopify/shopify-api";

export class MySqlSessionStorage extends SessionStorage {
  async storeSession(session) {
    await mySqlQury(
      `REPLACE INTO tbl_shopify_sessions 
       (id, shop, state, isOnline, accessToken, scope, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        session.id,
        session.shop,
        session.state || "",
        session.isOnline ? 1 : 0,
        session.accessToken,
        session.scope,
      ]
    );
    return true;
  }

  async loadSession(id) {
    const [rows] = await mySqlQury(
      "SELECT * FROM tbl_shopify_sessions WHERE id = ?",
      [id]
    );
    if (!rows.length) return undefined;
    const row = rows[0];
    return new shopifyApi.session.Session({
      id: row.id,
      shop: row.shop,
      state: row.state,
      isOnline: !!row.isOnline,
      accessToken: row.accessToken,
      scope: row.scope,
    });
  }

  async deleteSession(id) {
    await mySqlQury("DELETE FROM tbl_shopify_sessions WHERE id = ?", [id]);
    return true;
  }
}
