<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ACL_Ajax {

	public function __construct() {
		add_action( 'wp_ajax_acl_scan_single', array( $this, 'scan_single' ) );
	}

	/**
	 * Scan a single post via AJAX (admin bar re-scan button).
	 */
	public function scan_single() {
		$post_id = absint( $_GET['post_id'] ?? 0 );
		check_admin_referer( 'acl_scan_' . $post_id );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Unauthorized', 'accessibility-checker-lite' ) );
		}

		if ( ! $post_id ) {
			wp_die( esc_html__( 'Invalid post ID', 'accessibility-checker-lite' ) );
		}

		$issues = ACL_Scanner::scan_post( $post_id );

		// Redirect back to the post with results
		$redirect = get_permalink( $post_id );
		if ( ! $redirect ) {
			$redirect = admin_url( 'tools.php?page=accessibility-checker&tab=results&post_id=' . $post_id );
		}

		wp_safe_redirect( $redirect );
		exit;
	}
}
