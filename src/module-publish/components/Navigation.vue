<template>
	<v-list large>
		<v-list-item v-for="item in navItems" :key="item.to" :to="item.to">
			<v-list-item-icon>
				<v-icon :name="item.icon" />
			</v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="item.name" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import config from "../../config";

interface NavItem {
	to: string;
	icon: string;
	name: string;
}

const navItems: NavItem[] = [
	{
		to: `/${config.extension}/build`,
		icon: "build",
		name: "Build Sites",
	},
	{
		to: `/${config.extension}/settings`,
		icon: "settings",
		name: "Settings",
	},
];
</script>
