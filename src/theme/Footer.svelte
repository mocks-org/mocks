<script lang="ts">
	import { site } from '#lib/settings/site';
	import FooterCopyright from '#lib/components/layout/site/FooterCopyright.svelte';
	import NavLinks from '#lib/components/layout/site/NavLinks.svelte';
	import FooterLicences from '#lib/components/layout/site/FooterLicences.svelte';
	import FooterSocialNav from '#lib/components/layout/site/FooterSocialNav.svelte';
	import FooterCredit from '#lib/components/layout/site/FooterCredit.svelte';
</script>

<!--
	FORK-OWNED FILE — the site footer skin.
	Rearrange, restyle or drop blocks here. Content comes from
	#lib/settings/site.ts, so more links need no markup change.
	Do not add aria-*, role, tabindex or landmark elements here.
	Run `pnpm theme:check` after editing.
-->
<div class="mx-auto flex w-full max-w-8xl flex-col gap-4 px-4 py-8 text-sm sm:px-6 lg:px-8">
	<div class="flex w-full flex-wrap items-center justify-between gap-2">
		<FooterCopyright class="text-[12px]" />
		<NavLinks links={site.footerLinks} kind="footer" align="end" class="w-full sm:w-auto" />
	</div>
	<div class="flex flex-col gap-4">
		<p class="max-w-2xl text-xs text-balance">
			<span class="font-semibold">Disclaimer:</span>
			{site.disclaimer}
		</p>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<FooterLicences class="text-[12px]" />
			<FooterSocialNav class="flex justify-end" />
		</div>
	</div>
</div>

<FooterCredit class="px-2 pb-2 sm:px-4" />
