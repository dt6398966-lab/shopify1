import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  return (
    <Page>
      <TitleBar title="Dispatch Solutions - Dashboard" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Welcome to Dispatch Solutions 🚀
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Your Shopify store is now connected to Dispatch Solutions logistics platform. 
                    Orders from your store will be automatically synced and ready for fulfillment.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    How It Works
                  </Text>
                  <List>
                    <List.Item>
                      <strong>Automatic Order Sync:</strong> When a new order is created in your Shopify store, 
                      it's automatically imported into Dispatch Solutions with all product details, customer information, 
                      and shipping addresses.
                    </List.Item>
                    <List.Item>
                      <strong>Real-time Processing:</strong> Orders are processed immediately upon creation, 
                      ensuring fast fulfillment and shipping.
                    </List.Item>
                    <List.Item>
                      <strong>Complete Integration:</strong> All order data including product dimensions, weights, 
                      and customer details are automatically captured for accurate shipping calculations.
                    </List.Item>
                    <List.Item>
                      <strong>Tracking Updates:</strong> Shipment tracking information can be automatically 
                      updated back to your Shopify orders.
                    </List.Item>
                  </List>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Getting Started
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Your app is ready to use! Create a test order in your Shopify store to see the integration in action. 
                    The order will automatically appear in your Dispatch Solutions dashboard.
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Integration Status
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Connection Status
                      </Text>
                      <Text as="span" variant="bodyMd" tone="success">
                        ✅ Connected
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Webhooks
                      </Text>
                      <Text as="span" variant="bodyMd" tone="success">
                        ✅ Active
                      </Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Order Sync
                      </Text>
                      <Text as="span" variant="bodyMd" tone="success">
                        ✅ Enabled
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Need Help?
                  </Text>
                  <List>
                    <List.Item>
                      Check the{" "}
                      <Link
                        url="https://shopify.dev/docs/apps"
                        target="_blank"
                        removeUnderline
                      >
                        Shopify App Documentation
                      </Link>
                    </List.Item>
                    <List.Item>
                      Review your order sync status in the Dispatch Solutions dashboard
                    </List.Item>
                    <List.Item>
                      Contact support if you encounter any issues
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
