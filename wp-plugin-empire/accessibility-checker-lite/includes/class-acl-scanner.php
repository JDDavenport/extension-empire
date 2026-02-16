<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ACL_Scanner {

	/**
	 * Scan a post's content for accessibility issues.
	 */
	public static function scan_post( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return array();
		}

		$opts = get_option( 'acl_settings', array() );
		$content = apply_filters( 'the_content', $post->post_content );
		$url = get_permalink( $post_id );
		$issues = array();

		if ( ! empty( $opts['check_alt_text'] ) ) {
			$issues = array_merge( $issues, self::check_alt_text( $content ) );
		}

		if ( ! empty( $opts['check_headings'] ) ) {
			$issues = array_merge( $issues, self::check_headings( $content ) );
		}

		if ( ! empty( $opts['check_color_contrast'] ) ) {
			$issues = array_merge( $issues, self::check_color_contrast( $content ) );
		}

		if ( ! empty( $opts['check_link_text'] ) ) {
			$issues = array_merge( $issues, self::check_link_text( $content ) );
		}

		if ( ! empty( $opts['check_form_labels'] ) ) {
			$issues = array_merge( $issues, self::check_form_labels( $content ) );
		}

		// Save results
		self::save_results( $post_id, $url, $issues );

		return $issues;
	}

	/**
	 * Check for missing alt text on images.
	 * WCAG 1.1.1 — Non-text Content (Level A)
	 */
	private static function check_alt_text( $content ) {
		$issues = array();

		// Find all img tags
		if ( preg_match_all( '/<img\b[^>]*>/i', $content, $matches ) ) {
			foreach ( $matches[0] as $img ) {
				// Missing alt attribute entirely
				if ( ! preg_match( '/\balt\s*=/i', $img ) ) {
					$issues[] = array(
						'type'     => 'alt_text',
						'severity' => 'error',
						'element'  => self::truncate_element( $img ),
						'message'  => __( 'Image is missing alt attribute. All images must have alt text for screen readers.', 'accessibility-checker-lite' ),
						'wcag_ref' => '1.1.1',
					);
				}
				// Empty alt on non-decorative image (has src but alt="")
				elseif ( preg_match( '/\balt\s*=\s*["\']["\']/', $img ) ) {
					// Empty alt is valid for decorative images, but warn
					if ( ! preg_match( '/role\s*=\s*["\']presentation["\']/', $img ) ) {
						$issues[] = array(
							'type'     => 'alt_text',
							'severity' => 'warning',
							'element'  => self::truncate_element( $img ),
							'message'  => __( 'Image has empty alt text. If decorative, add role="presentation". If informative, add descriptive alt text.', 'accessibility-checker-lite' ),
							'wcag_ref' => '1.1.1',
						);
					}
				}
			}
		}

		return $issues;
	}

	/**
	 * Check heading structure.
	 * WCAG 1.3.1 — Info and Relationships (Level A)
	 * WCAG 2.4.6 — Headings and Labels (Level AA)
	 */
	private static function check_headings( $content ) {
		$issues = array();

		if ( preg_match_all( '/<h([1-6])\b[^>]*>(.*?)<\/h\1>/is', $content, $matches, PREG_OFFSET_CAPTURE ) ) {
			$levels = array();
			foreach ( $matches[1] as $i => $level_match ) {
				$level = (int) $level_match[0];
				$text = wp_strip_all_tags( $matches[2][ $i ][0] );
				$levels[] = $level;

				// Empty heading
				if ( empty( trim( $text ) ) ) {
					$issues[] = array(
						'type'     => 'headings',
						'severity' => 'error',
						'element'  => '<h' . $level . '>',
						'message'  => sprintf( __( 'Empty h%d heading found. Headings must have text content.', 'accessibility-checker-lite' ), $level ),
						'wcag_ref' => '1.3.1',
					);
				}

				// Skipped level
				if ( $i > 0 ) {
					$prev = $levels[ $i - 1 ];
					if ( $level > $prev + 1 ) {
						$issues[] = array(
							'type'     => 'headings',
							'severity' => 'warning',
							'element'  => '<h' . $level . '>' . esc_html( self::truncate_text( $text, 50 ) ),
							'message'  => sprintf(
								__( 'Heading level skipped: h%1$d follows h%2$d. Heading levels should increase by one.', 'accessibility-checker-lite' ),
								$level, $prev
							),
							'wcag_ref' => '1.3.1',
						);
					}
				}
			}

			// Check if first heading in content is h1 (should typically be h2+ in content)
			if ( ! empty( $levels ) && 1 === $levels[0] ) {
				$issues[] = array(
					'type'     => 'headings',
					'severity' => 'warning',
					'element'  => '<h1>',
					'message'  => __( 'h1 found in content. Most themes use h1 for the page title. Content headings should start at h2.', 'accessibility-checker-lite' ),
					'wcag_ref' => '2.4.6',
				);
			}
		}

		return $issues;
	}

	/**
	 * Check for potential color contrast issues in inline styles.
	 * WCAG 1.4.3 — Contrast (Minimum) (Level AA)
	 */
	private static function check_color_contrast( $content ) {
		$issues = array();

		// Find elements with inline color styles
		if ( preg_match_all( '/style\s*=\s*["\']([^"\']*color[^"\']*)["\']/', $content, $matches ) ) {
			foreach ( $matches[1] as $style ) {
				// Extract color values
				$fg = null;
				$bg = null;
				if ( preg_match( '/(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/i', $style, $fg_match ) ) {
					$fg = $fg_match[1];
				}
				if ( preg_match( '/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/i', $style, $bg_match ) ) {
					$bg = $bg_match[1];
				}

				if ( $fg && $bg ) {
					$ratio = self::calculate_contrast_ratio( $fg, $bg );
					if ( null !== $ratio && $ratio < 4.5 ) {
						$issues[] = array(
							'type'     => 'color_contrast',
							'severity' => 'error',
							'element'  => 'color:' . $fg . ' on ' . $bg,
							'message'  => sprintf(
								__( 'Insufficient color contrast ratio: %.1f:1 (minimum 4.5:1 for normal text). Foreground: %s, Background: %s', 'accessibility-checker-lite' ),
								$ratio, $fg, $bg
							),
							'wcag_ref' => '1.4.3',
						);
					}
				} elseif ( $fg ) {
					// Light foreground without explicit background
					$rgb = self::hex_to_rgb( $fg );
					if ( $rgb ) {
						$lum = self::relative_luminance( $rgb );
						if ( $lum > 0.7 ) {
							$issues[] = array(
								'type'     => 'color_contrast',
								'severity' => 'warning',
								'element'  => 'color:' . $fg,
								'message'  => sprintf( __( 'Light text color (%s) may have insufficient contrast on light backgrounds. Verify manually.', 'accessibility-checker-lite' ), $fg ),
								'wcag_ref' => '1.4.3',
							);
						}
					}
				}
			}
		}

		return $issues;
	}

	/**
	 * Check for non-descriptive link text.
	 * WCAG 2.4.4 — Link Purpose (Level A)
	 */
	private static function check_link_text( $content ) {
		$issues = array();
		$bad_texts = array( 'click here', 'here', 'read more', 'more', 'link', 'this', 'learn more' );

		if ( preg_match_all( '/<a\b[^>]*>(.*?)<\/a>/is', $content, $matches ) ) {
			foreach ( $matches[1] as $i => $link_html ) {
				$text = strtolower( trim( wp_strip_all_tags( $link_html ) ) );

				if ( empty( $text ) && ! preg_match( '/<img/', $link_html ) ) {
					$issues[] = array(
						'type'     => 'link_text',
						'severity' => 'error',
						'element'  => self::truncate_element( $matches[0][ $i ] ),
						'message'  => __( 'Link has no text content. Links must have descriptive text for screen readers.', 'accessibility-checker-lite' ),
						'wcag_ref' => '2.4.4',
					);
				} elseif ( in_array( $text, $bad_texts, true ) ) {
					$issues[] = array(
						'type'     => 'link_text',
						'severity' => 'warning',
						'element'  => self::truncate_element( $matches[0][ $i ] ),
						'message'  => sprintf( __( 'Non-descriptive link text: "%s". Use text that describes the link destination.', 'accessibility-checker-lite' ), $text ),
						'wcag_ref' => '2.4.4',
					);
				}
			}
		}

		return $issues;
	}

	/**
	 * Check form inputs for associated labels.
	 * WCAG 1.3.1, 4.1.2
	 */
	private static function check_form_labels( $content ) {
		$issues = array();

		if ( preg_match_all( '/<(input|select|textarea)\b([^>]*)>/i', $content, $matches ) ) {
			foreach ( $matches[2] as $i => $attrs ) {
				$tag = strtolower( $matches[1][ $i ] );

				// Skip hidden, submit, button, image types
				if ( preg_match( '/type\s*=\s*["\'](hidden|submit|button|image|reset)["\']/', $attrs ) ) {
					continue;
				}

				// Check for aria-label or aria-labelledby
				if ( preg_match( '/aria-label(ledby)?\s*=/', $attrs ) ) {
					continue;
				}

				// Check for id with matching label
				$has_id = preg_match( '/\bid\s*=\s*["\']([^"\']+)["\']/', $attrs, $id_match );
				if ( $has_id ) {
					$input_id = $id_match[1];
					if ( preg_match( '/for\s*=\s*["\']' . preg_quote( $input_id, '/' ) . '["\']/', $content ) ) {
						continue;
					}
				}

				// Check for title attribute
				if ( preg_match( '/\btitle\s*=/', $attrs ) ) {
					continue;
				}

				$issues[] = array(
					'type'     => 'form_labels',
					'severity' => 'error',
					'element'  => '<' . $tag . self::truncate_text( $attrs, 60 ) . '>',
					'message'  => sprintf( __( '%s element has no associated label. Add a <label> with matching "for" attribute, or use aria-label.', 'accessibility-checker-lite' ), '&lt;' . $tag . '&gt;' ),
					'wcag_ref' => '4.1.2',
				);
			}
		}

		return $issues;
	}

	/**
	 * Save scan results to database.
	 */
	private static function save_results( $post_id, $url, $issues ) {
		global $wpdb;
		$table = $wpdb->prefix . 'acl_scan_results';

		// Clear old results for this post
		$wpdb->delete( $table, array( 'post_id' => $post_id ), array( '%d' ) );

		foreach ( $issues as $issue ) {
			$wpdb->insert( $table, array(
				'post_id'    => $post_id,
				'url'        => $url,
				'issue_type' => $issue['type'],
				'severity'   => $issue['severity'],
				'element'    => $issue['element'],
				'message'    => $issue['message'],
				'wcag_ref'   => $issue['wcag_ref'],
				'scanned_at' => current_time( 'mysql' ),
			), array( '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s' ) );
		}
	}

	/**
	 * Get scan results for a post.
	 */
	public static function get_results( $post_id ) {
		global $wpdb;
		$table = $wpdb->prefix . 'acl_scan_results';
		return $wpdb->get_results( $wpdb->prepare(
			"SELECT * FROM {$table} WHERE post_id = %d ORDER BY severity ASC, issue_type ASC",
			$post_id
		) );
	}

	/**
	 * Get summary counts across all scanned posts.
	 */
	public static function get_summary() {
		global $wpdb;
		$table = $wpdb->prefix . 'acl_scan_results';
		return $wpdb->get_results(
			"SELECT severity, COUNT(*) as count FROM {$table} GROUP BY severity"
		);
	}

	// --- Color contrast helpers ---

	private static function hex_to_rgb( $hex ) {
		$hex = ltrim( $hex, '#' );
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		if ( 6 !== strlen( $hex ) ) {
			return null;
		}
		return array(
			hexdec( substr( $hex, 0, 2 ) ),
			hexdec( substr( $hex, 2, 2 ) ),
			hexdec( substr( $hex, 4, 2 ) ),
		);
	}

	private static function relative_luminance( $rgb ) {
		$vals = array();
		foreach ( $rgb as $c ) {
			$c = $c / 255;
			$vals[] = ( $c <= 0.03928 ) ? $c / 12.92 : pow( ( $c + 0.055 ) / 1.055, 2.4 );
		}
		return 0.2126 * $vals[0] + 0.7152 * $vals[1] + 0.0722 * $vals[2];
	}

	private static function calculate_contrast_ratio( $fg, $bg ) {
		$fg_rgb = self::hex_to_rgb( $fg );
		$bg_rgb = self::hex_to_rgb( $bg );
		if ( ! $fg_rgb || ! $bg_rgb ) {
			return null;
		}
		$l1 = self::relative_luminance( $fg_rgb );
		$l2 = self::relative_luminance( $bg_rgb );
		$lighter = max( $l1, $l2 );
		$darker = min( $l1, $l2 );
		return ( $lighter + 0.05 ) / ( $darker + 0.05 );
	}

	private static function truncate_element( $html, $len = 100 ) {
		return ( strlen( $html ) > $len ) ? substr( $html, 0, $len ) . '…' : $html;
	}

	private static function truncate_text( $text, $len = 50 ) {
		return ( strlen( $text ) > $len ) ? substr( $text, 0, $len ) . '…' : $text;
	}
}
