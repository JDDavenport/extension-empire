<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ACL_Admin_Bar {

	public function __construct() {
		$opts = get_option( 'acl_settings', array() );
		if ( ! empty( $opts['enabled'] ) && ! empty( $opts['admin_bar_summary'] ) ) {
			add_action( 'admin_bar_menu', array( $this, 'add_admin_bar_node' ), 999 );
			add_action( 'wp_head', array( $this, 'admin_bar_styles' ) );
			add_action( 'admin_head', array( $this, 'admin_bar_styles' ) );
		}

		if ( ! empty( $opts['enabled'] ) && ! empty( $opts['highlight_issues'] ) ) {
			add_action( 'wp_footer', array( $this, 'highlight_issues_frontend' ) );
		}
	}

	public function add_admin_bar_node( $wp_admin_bar ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$post_id = 0;
		if ( is_singular() ) {
			$post_id = get_queried_object_id();
		}

		$errors = 0;
		$warnings = 0;

		if ( $post_id ) {
			$results = ACL_Scanner::get_results( $post_id );
			foreach ( $results as $r ) {
				if ( 'error' === $r->severity ) $errors++;
				else $warnings++;
			}
		}

		$total = $errors + $warnings;
		$color = $total === 0 ? '#00a32a' : ( $errors > 0 ? '#d63638' : '#dba617' );

		$title = sprintf(
			'♿ <span style="color:%s;">%d</span>',
			esc_attr( $color ),
			$total
		);

		$wp_admin_bar->add_node( array(
			'id'    => 'acl-checker',
			'title' => $title,
			'href'  => admin_url( 'tools.php?page=accessibility-checker&tab=results' . ( $post_id ? '&post_id=' . $post_id : '' ) ),
		) );

		if ( $post_id && $total > 0 ) {
			if ( $errors > 0 ) {
				$wp_admin_bar->add_node( array(
					'parent' => 'acl-checker',
					'id'     => 'acl-errors',
					'title'  => sprintf( __( '🔴 %d Errors', 'accessibility-checker-lite' ), $errors ),
					'href'   => admin_url( 'tools.php?page=accessibility-checker&tab=results&post_id=' . $post_id ),
				) );
			}
			if ( $warnings > 0 ) {
				$wp_admin_bar->add_node( array(
					'parent' => 'acl-checker',
					'id'     => 'acl-warnings',
					'title'  => sprintf( __( '🟡 %d Warnings', 'accessibility-checker-lite' ), $warnings ),
					'href'   => admin_url( 'tools.php?page=accessibility-checker&tab=results&post_id=' . $post_id ),
				) );
			}

			$wp_admin_bar->add_node( array(
				'parent' => 'acl-checker',
				'id'     => 'acl-rescan',
				'title'  => __( '🔄 Re-scan This Page', 'accessibility-checker-lite' ),
				'href'   => wp_nonce_url( admin_url( 'admin-ajax.php?action=acl_scan_single&post_id=' . $post_id ), 'acl_scan_' . $post_id ),
			) );
		} elseif ( $post_id ) {
			$wp_admin_bar->add_node( array(
				'parent' => 'acl-checker',
				'id'     => 'acl-clean',
				'title'  => __( '✅ No issues found', 'accessibility-checker-lite' ),
				'href'   => '#',
			) );
			$wp_admin_bar->add_node( array(
				'parent' => 'acl-checker',
				'id'     => 'acl-rescan',
				'title'  => __( '🔄 Scan This Page', 'accessibility-checker-lite' ),
				'href'   => wp_nonce_url( admin_url( 'admin-ajax.php?action=acl_scan_single&post_id=' . $post_id ), 'acl_scan_' . $post_id ),
			) );
		}

		$wp_admin_bar->add_node( array(
			'parent' => 'acl-checker',
			'id'     => 'acl-dashboard',
			'title'  => __( '📊 Full Dashboard', 'accessibility-checker-lite' ),
			'href'   => admin_url( 'tools.php?page=accessibility-checker&tab=results' ),
		) );
	}

	public function admin_bar_styles() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		echo '<style>#wp-admin-bar-acl-checker .ab-item{font-weight:600;}</style>';
	}

	public function highlight_issues_frontend() {
		if ( ! current_user_can( 'manage_options' ) || ! is_singular() ) {
			return;
		}

		$post_id = get_queried_object_id();
		$results = ACL_Scanner::get_results( $post_id );
		if ( empty( $results ) ) {
			return;
		}
		?>
		<style>
		.acl-highlight-error { outline: 3px solid #d63638 !important; position: relative; }
		.acl-highlight-warning { outline: 3px dashed #dba617 !important; position: relative; }
		.acl-highlight-error::after, .acl-highlight-warning::after {
			content: attr(data-acl-msg);
			position: absolute;
			bottom: 100%;
			left: 0;
			background: #1d2327;
			color: #fff;
			font-size: 12px;
			padding: 4px 8px;
			border-radius: 4px;
			white-space: nowrap;
			max-width: 300px;
			overflow: hidden;
			text-overflow: ellipsis;
			z-index: 99999;
			display: none;
		}
		.acl-highlight-error:hover::after, .acl-highlight-warning:hover::after { display: block; }
		</style>
		<script>
		(function() {
			// Highlight images missing alt
			document.querySelectorAll('img:not([alt])').forEach(function(img) {
				img.classList.add('acl-highlight-error');
				img.setAttribute('data-acl-msg', 'Missing alt text (WCAG 1.1.1)');
			});
			document.querySelectorAll('img[alt=""]').forEach(function(img) {
				if (!img.getAttribute('role')) {
					img.classList.add('acl-highlight-warning');
					img.setAttribute('data-acl-msg', 'Empty alt text — decorative? (WCAG 1.1.1)');
				}
			});
			// Highlight empty links
			document.querySelectorAll('a').forEach(function(a) {
				var text = a.textContent.trim();
				if (!text && !a.querySelector('img')) {
					a.classList.add('acl-highlight-error');
					a.setAttribute('data-acl-msg', 'Empty link text (WCAG 2.4.4)');
				}
			});
		})();
		</script>
		<?php
	}
}
