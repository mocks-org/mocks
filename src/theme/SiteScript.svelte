<script lang="ts">
	/**
	 * Fork seam: client-side enhancements for the public site.
	 *
	 * Rendered once by `src/routes/(site)/+layout.svelte`, so it runs on the
	 * homepage and the content pages but never inside an exam session. Empty by
	 * design. Upstream never edits this file after release.
	 *
	 * Use an effect (`onMount` or `$effect`), not a literal `<script>` tag: a
	 * script element in markup does not re-run on client-side navigation.
	 *
	 * Clean up what you start.
	 */
</script>
