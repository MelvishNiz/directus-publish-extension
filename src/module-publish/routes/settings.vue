<template>
	<private-view title="Settings">
		<template #headline>Publish</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="settings" />
			</v-button>
		</template>

		<template #actions>
			<v-button
				@click="showAddSiteDrawer = true"
				tooltip.bottom="Add Site"
				rounded
				icon>
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<Navigation />
		</template>

		<!-- Loading -->
		<div v-if="loading" style="margin: 25px auto; max-width: 50px">
			<v-progress-circular indeterminate />
		</div>

		<!-- Setup Error -->
		<Error
			v-if="!loading && setupMessage"
			title="Setup Failed"
			:message="setupMessage"
		/>

		<!-- No Sites -->
		<Message
			v-if="!loading && !setupMessage && (!sites || sites.length === 0)"
			icon="add"
			title="Add Site"
			subtitle="No Sites Configured">
			Click the
			<strong
				>&nbsp;&nbsp;<v-icon class="btn-color" name="add_circle"></v-icon
				>&nbsp;</strong
			>
			Add button above to add a Site.
		</Message>

		<!-- List of Sites -->
		<Sites
			v-if="!loading && !setupMessage && sites && sites.length > 0"
			page="settings"
			:sites="sites"
			@update="displaySites"
			@loading="loading = true"
		/>

		<!-- Add Site Drawer -->
		<AddSiteDrawer
			:show="showAddSiteDrawer"
			@close="showAddSiteDrawer = false"
			@done="displaySites"
		/>
	</private-view>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import type { AxiosInstance } from "axios";

import {
	collectionExists,
	createCollection,
	getSites,
} from "../settings";
import AddSiteDrawer from "../components/AddSiteDrawer.vue";
import Message from "../components/message.vue";
import Sites from "../components/Sites.vue";
import Navigation from "../components/Navigation.vue";

// --- Injected API dari Directus UI ---
const api = inject<AxiosInstance>("api");

// --- State ---
const loading = ref(true);
const setupMessage = ref<string | undefined>();
const sites = ref<Record<string, any>[] | undefined>();
const showAddSiteDrawer = ref(false);

// --- Methods ---
async function setup() {
	if (!api) return false;

	const exists = await collectionExists(api);
	if (!exists) {
		const success = await createCollection(api);
		return success;
	}
	return true;
}

async function displaySites() {
	if (!api) return;
	loading.value = true;

	const result = await getSites(api);

	if (!result || result.length === 0) {
		if (!sites.value || sites.value.length === 0) {
			setupMessage.value = "Could not get Sites from Settings";
		}
		sites.value = [];
	} else {
		sites.value = result;
	}
	loading.value = false;
}

// --- Lifecycle ---
onMounted(async () => {
	const success = await setup();
	if (!success) {
		setupMessage.value = "Could not create Settings Collection";
		loading.value = false;
	} else {
		await displaySites();
	}
});
</script>

<style scoped>
.btn-color {
	color: var(--v-button-background-color);
}
</style>
