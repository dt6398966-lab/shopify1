import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Dispatch Solutions - Shopify Integration</h1>
        <p className={styles.text}>
          Seamlessly connect your Shopify store with Dispatch Solutions logistics platform. Automatically sync orders, manage shipments, and track deliveries all in one place.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Connect Store
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Automatic Order Sync</strong>. Orders from your Shopify store are automatically imported into Dispatch Solutions for seamless logistics management.
          </li>
          <li>
            <strong>Real-time Tracking</strong>. Track shipments and deliveries in real-time with automatic updates to your Shopify orders.
          </li>
          <li>
            <strong>Complete Integration</strong>. Full integration with product details, customer information, and shipping addresses for accurate fulfillment.
          </li>
        </ul>
      </div>
    </div>
  );
}
