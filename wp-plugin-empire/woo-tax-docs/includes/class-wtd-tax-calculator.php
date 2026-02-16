<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WTD_Tax_Calculator {

	/**
	 * Determine jurisdiction and tax type from a WooCommerce order.
	 */
	public static function get_jurisdiction( $order ) {
		$country = $order->get_billing_country();
		$state = $order->get_billing_state();

		$eu_countries = array(
			'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
			'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
		);

		if ( 'US' === $country ) {
			return array(
				'jurisdiction' => 'US',
				'region'       => $state,
				'tax_type'     => 'sales_tax',
			);
		}

		if ( in_array( $country, $eu_countries, true ) ) {
			return array(
				'jurisdiction' => 'EU',
				'region'       => $country,
				'tax_type'     => 'vat',
			);
		}

		if ( 'GB' === $country ) {
			return array(
				'jurisdiction' => 'UK',
				'region'       => $country,
				'tax_type'     => 'vat',
			);
		}

		if ( 'AU' === $country ) {
			return array(
				'jurisdiction' => 'AU',
				'region'       => $state,
				'tax_type'     => 'gst',
			);
		}

		return array(
			'jurisdiction' => 'OTHER',
			'region'       => $country,
			'tax_type'     => 'tax',
		);
	}

	/**
	 * Get the configured tax label for a jurisdiction.
	 */
	public static function get_tax_label( $jurisdiction ) {
		$opts = get_option( 'wtd_settings', array() );
		$map = array(
			'US'    => $opts['tax_label_us'] ?? __( 'Sales Tax', 'woo-tax-docs' ),
			'EU'    => $opts['tax_label_eu'] ?? __( 'VAT', 'woo-tax-docs' ),
			'UK'    => $opts['tax_label_uk'] ?? __( 'VAT', 'woo-tax-docs' ),
			'AU'    => $opts['tax_label_au'] ?? __( 'GST', 'woo-tax-docs' ),
			'OTHER' => __( 'Tax', 'woo-tax-docs' ),
		);
		return $map[ $jurisdiction ] ?? __( 'Tax', 'woo-tax-docs' );
	}
}
