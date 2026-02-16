<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CCS_Geo {

	private static $eu_countries = array(
		'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
		'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
		'IS','LI','NO','GB','CH',
	);

	private static $us_ccpa_states = array( 'CA', 'VA', 'CO', 'CT', 'UT' );

	/**
	 * Determine if the banner should show for current visitor.
	 */
	public static function should_show_banner() {
		$opts = get_option( 'ccs_settings', array() );

		if ( empty( $opts['enabled'] ) ) {
			return false;
		}

		if ( ! empty( $opts['show_globally'] ) ) {
			return true;
		}

		if ( empty( $opts['geo_detection'] ) ) {
			return true;
		}

		$geo = self::get_visitor_geo();

		if ( ! empty( $opts['show_in_eu'] ) && in_array( $geo['country'], self::$eu_countries, true ) ) {
			return true;
		}

		if ( ! empty( $opts['show_in_us'] ) && 'US' === $geo['country'] ) {
			return true;
		}

		return false;
	}

	/**
	 * Get visitor geo info. Uses transient caching per IP hash.
	 */
	public static function get_visitor_geo() {
		$ip = self::get_visitor_ip();
		$hash = hash( 'sha256', $ip . wp_salt() );
		$cache_key = 'ccs_geo_' . substr( $hash, 0, 16 );

		$cached = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$geo = array( 'country' => '', 'region' => '' );

		// Use ip-api.com free tier (no key needed, 45 req/min)
		$response = wp_remote_get( 'http://ip-api.com/json/' . $ip . '?fields=countryCode,region', array(
			'timeout' => 3,
		) );

		if ( ! is_wp_error( $response ) ) {
			$body = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( ! empty( $body['countryCode'] ) ) {
				$geo['country'] = sanitize_text_field( $body['countryCode'] );
				$geo['region']  = sanitize_text_field( $body['region'] ?? '' );
			}
		}

		set_transient( $cache_key, $geo, HOUR_IN_SECONDS );
		return $geo;
	}

	public static function get_visitor_ip() {
		$headers = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR' );
		foreach ( $headers as $header ) {
			if ( ! empty( $_SERVER[ $header ] ) ) {
				$ip = explode( ',', sanitize_text_field( wp_unslash( $_SERVER[ $header ] ) ) );
				return trim( $ip[0] );
			}
		}
		return '127.0.0.1';
	}
}
