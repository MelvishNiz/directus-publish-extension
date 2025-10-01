import { defineModule } from '@directus/extensions-sdk';
import config from "../config";
import Build from "./routes/build.vue";
import Settings from "./routes/settings.vue";

export default defineModule({
	id: config.extension,
	name: "Publish",
	icon: "cloud_upload",
	routes: [
		{
			path: "",
			redirect: `/${config.extension}/build`,
		},
		{
			path: "build",
			component: Build,
		},
		{
			path: "settings",
			component: Settings,
		},
	],
});
