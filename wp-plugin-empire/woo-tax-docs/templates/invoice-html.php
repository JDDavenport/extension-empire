<?php
/**
 * Invoice HTML template.
 *
 * Variables available: $order, $invoice, $opts, $tax_label, $jurisdiction
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$date_format = $opts['date_format'] ?? 'Y-m-d';
$billing_address = $order->get_formatted_billing_address();
$order_date = $order->get_date_created();
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title><?php echo esc_html( sprintf( __( 'Invoice %s', 'woo-tax-docs' ), $invoice->invoice_number ) ); ?></title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: #333; margin: 0; padding: 40px; }
.invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2271b1; padding-bottom: 20px; }
.company-info h1 { margin: 0 0 5px; font-size: 24px; color: #1d2327; }
.company-info p { margin: 2px 0; color: #666; }
.invoice-meta { text-align: right; }
.invoice-meta h2 { margin: 0; font-size: 28px; color: #2271b1; text-transform: uppercase; }
.invoice-meta table { margin-top: 10px; }
.invoice-meta td { padding: 2px 10px; }
.invoice-meta td:first-child { color: #666; text-align: right; }
.addresses { display: flex; gap: 40px; margin-bottom: 30px; }
.addresses > div { flex: 1; }
.addresses h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: #666; letter-spacing: 1px; }
.line-items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
.line-items th { background: #f0f0f1; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #ddd; }
.line-items td { padding: 10px 12px; border-bottom: 1px solid #eee; }
.line-items .text-right { text-align: right; }
.totals { margin-left: auto; width: 300px; }
.totals table { width: 100%; }
.totals td { padding: 6px 12px; }
.totals td:last-child { text-align: right; }
.totals .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #333; }
.footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
.tax-badge { display: inline-block; background: #2271b1; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; }
.logo { max-height: 60px; max-width: 200px; }
@media print { body { padding: 20px; } }
</style>
</head>
<body>

<div class="invoice-header">
	<div class="company-info">
		<?php if ( ! empty( $opts['company_logo'] ) ) : ?>
			<img src="<?php echo esc_url( $opts['company_logo'] ); ?>" class="logo" alt="" />
		<?php endif; ?>
		<h1><?php echo esc_html( $opts['company_name'] ?? '' ); ?></h1>
		<p><?php echo nl2br( esc_html( $opts['company_address'] ?? '' ) ); ?></p>
		<?php if ( ! empty( $opts['company_tax_id'] ) ) : ?>
			<p><?php echo esc_html( $tax_label ); ?> <?php esc_html_e( 'ID:', 'woo-tax-docs' ); ?> <?php echo esc_html( $opts['company_tax_id'] ); ?></p>
		<?php endif; ?>
	</div>
	<div class="invoice-meta">
		<h2><?php esc_html_e( 'Invoice', 'woo-tax-docs' ); ?></h2>
		<table>
			<tr><td><?php esc_html_e( 'Invoice #', 'woo-tax-docs' ); ?></td><td><strong><?php echo esc_html( $invoice->invoice_number ); ?></strong></td></tr>
			<tr><td><?php esc_html_e( 'Date', 'woo-tax-docs' ); ?></td><td><?php echo esc_html( $order_date ? $order_date->date( $date_format ) : '' ); ?></td></tr>
			<tr><td><?php esc_html_e( 'Order #', 'woo-tax-docs' ); ?></td><td><?php echo esc_html( $order->get_order_number() ); ?></td></tr>
			<tr><td></td><td><span class="tax-badge"><?php echo esc_html( strtoupper( $jurisdiction['jurisdiction'] ) . ' ' . $tax_label ); ?></span></td></tr>
		</table>
	</div>
</div>

<div class="addresses">
	<div>
		<h3><?php esc_html_e( 'Bill To', 'woo-tax-docs' ); ?></h3>
		<?php echo wp_kses_post( $billing_address ); ?>
		<?php
		$customer_tax_id = $order->get_meta( '_billing_vat_number' );
		if ( $customer_tax_id ) :
		?>
			<p><?php echo esc_html( $tax_label ); ?> #: <?php echo esc_html( $customer_tax_id ); ?></p>
		<?php endif; ?>
	</div>
	<?php if ( $order->get_formatted_shipping_address() ) : ?>
	<div>
		<h3><?php esc_html_e( 'Ship To', 'woo-tax-docs' ); ?></h3>
		<?php echo wp_kses_post( $order->get_formatted_shipping_address() ); ?>
	</div>
	<?php endif; ?>
</div>

<table class="line-items">
	<thead>
		<tr>
			<th><?php esc_html_e( 'Item', 'woo-tax-docs' ); ?></th>
			<th><?php esc_html_e( 'SKU', 'woo-tax-docs' ); ?></th>
			<th class="text-right"><?php esc_html_e( 'Qty', 'woo-tax-docs' ); ?></th>
			<th class="text-right"><?php esc_html_e( 'Unit Price', 'woo-tax-docs' ); ?></th>
			<th class="text-right"><?php echo esc_html( $tax_label ); ?></th>
			<th class="text-right"><?php esc_html_e( 'Total', 'woo-tax-docs' ); ?></th>
		</tr>
	</thead>
	<tbody>
		<?php foreach ( $order->get_items() as $item ) :
			$product = $item->get_product();
			$sku = $product ? $product->get_sku() : '';
			$qty = $item->get_quantity();
			$subtotal = (float) $item->get_subtotal();
			$tax = (float) $item->get_total_tax();
			$total = (float) $item->get_total() + $tax;
			$unit = $qty > 0 ? $subtotal / $qty : 0;
		?>
		<tr>
			<td><?php echo esc_html( $item->get_name() ); ?></td>
			<td><?php echo esc_html( $sku ); ?></td>
			<td class="text-right"><?php echo esc_html( $qty ); ?></td>
			<td class="text-right"><?php echo wc_price( $unit ); ?></td>
			<td class="text-right"><?php echo wc_price( $tax ); ?></td>
			<td class="text-right"><?php echo wc_price( $total ); ?></td>
		</tr>
		<?php endforeach; ?>
	</tbody>
</table>

<div class="totals">
	<table>
		<tr>
			<td><?php esc_html_e( 'Subtotal', 'woo-tax-docs' ); ?></td>
			<td><?php echo wc_price( $order->get_subtotal() ); ?></td>
		</tr>
		<?php if ( (float) $order->get_shipping_total() > 0 ) : ?>
		<tr>
			<td><?php esc_html_e( 'Shipping', 'woo-tax-docs' ); ?></td>
			<td><?php echo wc_price( $order->get_shipping_total() ); ?></td>
		</tr>
		<?php endif; ?>
		<?php if ( (float) $order->get_total_discount() > 0 ) : ?>
		<tr>
			<td><?php esc_html_e( 'Discount', 'woo-tax-docs' ); ?></td>
			<td>-<?php echo wc_price( $order->get_total_discount() ); ?></td>
		</tr>
		<?php endif; ?>
		<tr>
			<td><?php echo esc_html( $tax_label ); ?></td>
			<td><?php echo wc_price( $order->get_total_tax() ); ?></td>
		</tr>
		<tr class="total-row">
			<td><?php esc_html_e( 'Total', 'woo-tax-docs' ); ?></td>
			<td><?php echo wc_price( $order->get_total() ); ?></td>
		</tr>
	</table>
</div>

<?php if ( ! empty( $opts['footer_text'] ) ) : ?>
<div class="footer">
	<p><?php echo esc_html( $opts['footer_text'] ); ?></p>
</div>
<?php endif; ?>

</body>
</html>
