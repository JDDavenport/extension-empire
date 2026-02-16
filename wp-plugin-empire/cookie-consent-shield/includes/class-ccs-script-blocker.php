<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CCS_Script_Blocker {

	public function __construct() {
		if ( ! is_admin() ) {
			add_action( 'template_redirect', array( $this, 'maybe_start_buffer' ) );
		}
	}

	public function maybe_start_buffer() {
		$opts = get_option( 'ccs_settings', array() );
		$patterns = trim( $opts['blocked_scripts'] ?? '' );

		if ( empty( $patterns ) ) {
			return;
		}

		// If user already consented to all, don't block
		if ( isset( $_COOKIE['ccs_consent'] ) && 'all' === $_COOKIE['ccs_consent'] ) {
			return;
		}

		ob_start( array( $this, 'filter_output' ) );
	}

	public function filter_output( $html ) {
		$opts = get_option( 'ccs_settings', array() );
		$patterns = array_filter( array_map( 'trim', explode( "\n", $opts['blocked_scripts'] ?? '' ) ) );

		if ( empty( $patterns ) ) {
			return $html;
		}

		foreach ( $patterns as $pattern ) {
			$pattern = preg_quote( $pattern, '/' );
			// Convert script tags with matching src to type="text/plain" data-ccs-blocked
			$html = preg_replace(
				'/<script([^>]*src=["\'][^"\']*' . $pattern . '[^"\']*["\'][^>]*)>/i',
				'<script type="text/plain" data-ccs-blocked="analytics"$1>',
				$html
			);
		}

		return $html;
	}
}
