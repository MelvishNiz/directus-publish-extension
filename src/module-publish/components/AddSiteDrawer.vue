<template>
	<div>
		<!-- Add Site Drawer -->
		<v-drawer
			v-model="localShow"
			@cancel="$emit('close')"
			persistent
			title="Adding New Site"
			subtitle="Settings"
			icon="add"
		>
			<div>
				<!-- Site Name -->
				<div class="input-row">
					<div class="type-label">
						Site Name
						<v-icon tooltip="Required" class="required" name="star" sup />
					</div>
					<v-input v-model="name" placeholder="Production" autofocus />
				</div>

				<!-- Public URL -->
				<div class="input-row">
					<div class="type-label">
						Public URL
						<v-icon tooltip="Required" class="required" name="star" sup />
					</div>
					<v-input v-model="url" placeholder="https://www.example.com" />
				</div>

				<!-- Local Path -->
				<div class="input-row">
					<div class="type-label">
						Local Path to Site
						<v-icon tooltip="Required" class="required" name="star" sup />
					</div>
					<v-input v-model="path" placeholder="/site" />
				</div>

				<!-- Build Command -->
				<div class="input-row">
					<div class="type-label">
						Build Command
						<v-icon tooltip="Required" class="required" name="star" sup />
					</div>
					<v-input v-model="command" placeholder="build">
						<template #prepend>npm run </template>
					</v-input>
				</div>

				<!-- Env Vars -->
				<div class="input-row">
					<div class="type-label">Environment Variables</div>
					<div class="envvar-input-row">
						<div class="envvar-input-key">
							<v-input v-model="envVarKey" placeholder="API_URL" />
						</div>
						<div class="envvar-input-value">
							<v-input v-model="envVarValue" placeholder="https://api.example.com" />
						</div>
						<div class="envvar-input-add">
							<v-button @click="addEnvVar" icon>
								<v-icon name="done" />
							</v-button>
						</div>
					</div>
					<br />
					<template v-for="(value, key) in env" :key="key">
						<div class="envvar-display-row">
							<div class="envvar-display-value">
								<code>{{ key }}={{ value }}</code>
							</div>
							<div class="envvar-display-remove">
								<v-button
									class="danger"
									@click="removeEnvVar(key)"
									x-small
									icon
								>
									<v-icon name="clear" />
								</v-button>
							</div>
						</div>
					</template>
				</div>

				<br /><br />

				<div style="max-width: 250px; margin: 0 auto">
					<v-button @click="startSaveSite" :disabled="saving" full-width>
						Save
					</v-button>
				</div>
			</div>
		</v-drawer>

		<!-- Add Site Error Dialog -->
		<Dialog
			:show="!!dialog"
			:title="dialog?.title"
			:message="dialog?.message"
			:close="dialog?.close"
			@close="dialog = undefined"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, inject, watch } from "vue";
import type { AxiosInstance } from "axios";
import { saveSite } from "../settings";
import Dialog from "./Dialog.vue";

// props & emits
const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
	(e: "close"): void;
	(e: "done"): void;
}>();

// api dari Directus
const api = inject<AxiosInstance>("api");

// local state
const localShow = ref(props.show);
watch(
	() => props.show,
	(val) => (localShow.value = val)
);
watch(localShow, (val) => {
	if (!val) emit("close");
});

const name = ref<string>();
const path = ref<string>();
const command = ref<string>();
const url = ref<string>();
const saving = ref(false);

const dialog = ref<{ title: string; message: string; close: string }>();

const envVarKey = ref<string>();
const envVarValue = ref<string>();
const env = ref<Record<string, string>>({});

// methods
function addEnvVar() {
	if (envVarKey.value && envVarValue.value) {
		env.value[envVarKey.value] = envVarValue.value;
		envVarKey.value = undefined;
		envVarValue.value = undefined;
	}
}

function removeEnvVar(key: string) {
	if (env.value.hasOwnProperty(key)) {
		delete env.value[key];
	}
}

function displayError(msg: string) {
	dialog.value = {
		title: "Error",
		message: msg,
		close: "OK",
	};
}

async function startSaveSite() {
	if (!api) return;

	if (!name.value) return displayError("Site Name is required");
	if (!path.value) return displayError("Local path to Site is required");
	if (!command.value) return displayError("Site build command is required");
	if (!url.value) return displayError("URL of site is required");

	saving.value = true;
	const success = await new Promise<boolean>((resolve) =>
		saveSite(api, name.value!, path.value!, command.value!, url.value!, env.value, (ok) =>
			resolve(ok)
		)
	);

	saving.value = false;
	if (!success) {
		displayError("Could not add Site to Settings");
	} else {
		name.value = undefined;
		path.value = undefined;
		command.value = undefined;
		url.value = undefined;
		env.value = {};
		emit("close");
		emit("done");
	}
}
</script>

<style scoped>
div.input-row {
	padding: 10px 32px;
}
div.type-label {
	padding-bottom: 5px;
}
div.envvar-input-row,
div.envvar-display-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 15px;
}
div.envvar-input-key,
div.envvar-input-value,
div.envvar-display-value {
	flex-grow: 1;
}
code {
	font-family: monospace;
}
.v-button.danger {
	--v-button-color: var(--danger-alt);
	--v-button-background-color: var(--danger);
	--v-button-color-hover: var(--danger-alt);
	--v-button-background-color-hover: var(--danger-125);
}
</style>
