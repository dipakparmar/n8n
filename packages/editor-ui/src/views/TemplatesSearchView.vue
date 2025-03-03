<template>
	<TemplatesView>
		<template v-slot:header>
			<div :class="$style.wrapper">
				<div :class="$style.title">
					<n8n-heading tag="h1" size="2xlarge">
						{{ $locale.baseText('templates.heading') }}
					</n8n-heading>
				</div>
				<div :class="$style.button">
					<n8n-button
						size="medium"
						:label="$locale.baseText('templates.newButton')"
						@click="openNewWorkflow"
					/>
				</div>
			</div>
		</template>
		<template v-slot:content>
			<div :class="$style.contentWrapper">
				<div :class="$style.filters">
					<TemplateFilters
						:categories="allCategories"
						:sortOnPopulate="areCategoriesPrepopulated"
						:loading="loadingCategories"
						:selected="categories"
						@clear="onCategoryUnselected"
						@clearAll="onCategoriesCleared"
						@select="onCategorySelected"
					/>
				</div>
				<div :class="$style.search">
					<n8n-input
						:value="search"
						:placeholder="$locale.baseText('templates.searchPlaceholder')"
						@input="onSearchInput"
						@blur="trackSearch"
						clearable
					>
						<font-awesome-icon icon="search" slot="prefix" />
					</n8n-input>
					<div :class="$style.carouselContainer" v-show="collections.length || loadingCollections">
						<div :class="$style.header">
							<n8n-heading :bold="true" size="medium" color="text-light">
								{{ $locale.baseText('templates.collections') }}
								<span v-if="!loadingCollections" v-text="`(${collections.length})`" />
							</n8n-heading>
						</div>

						<CollectionsCarousel
							:collections="collections"
							:loading="loadingCollections"
							@openCollection="onOpenCollection"
						/>
					</div>
					<TemplateList
						:infinite-scroll-enabled="true"
						:loading="loadingWorkflows"
						:total-workflows="totalWorkflows"
						:workflows="workflows"
						@loadMore="onLoadMore"
						@openTemplate="onOpenTemplate"
					/>
					<div v-if="endOfSearchMessage" :class="$style.endText">
						<n8n-text size="medium" color="text-base">
							<span v-html="endOfSearchMessage" />
						</n8n-text>
					</div>
				</div>
			</div>
		</template>
	</TemplatesView>
</template>

<script lang="ts">
import CollectionsCarousel from '@/components/CollectionsCarousel.vue';
import TemplateFilters from '@/components/TemplateFilters.vue';
import TemplateList from '@/components/TemplateList.vue';
import TemplatesView from './TemplatesView.vue';

import { genericHelpers } from '@/components/mixins/genericHelpers';
import { ITemplatesCollection, ITemplatesWorkflow, ITemplatesQuery, ITemplatesCategory } from '@/Interface';
import mixins from 'vue-typed-mixins';
import { mapGetters } from 'vuex';
import { IDataObject } from 'n8n-workflow';
import { setPageTitle } from '@/components/helpers';

interface ISearchEvent {
	search_string: string;
	workflow_results_count: number;
	collection_results_count: number;
	categories_applied: ITemplatesCategory[];
	wf_template_repo_session_id: number;
}

export default mixins(genericHelpers).extend({
	name: 'TemplatesSearchView',
	components: {
		CollectionsCarousel,
		TemplateFilters,
		TemplateList,
		TemplatesView,
	},
	computed: {
		...mapGetters('templates', ['allCategories', 'getSearchedWorkflowsTotal', 'getSearchedWorkflows', 'getSearchedCollections']),
		...mapGetters('settings', ['isTemplatesEndpointReachable']),
		collections(): ITemplatesCollection[] {
			return this.getSearchedCollections(this.query) || [];
		},
		endOfSearchMessage(): string | null {
			if (this.loadingWorkflows) {
				return null;
			}
			if (this.workflows.length && this.workflows.length >= this.totalWorkflows) {
				return this.$locale.baseText('templates.endResult');
			}
			if (!this.loadingCollections && this.workflows.length === 0 && this.collections.length === 0) {
				if (!this.isTemplatesEndpointReachable && this.errorLoadingWorkflows) {
					return this.$locale.baseText('templates.connectionWarning');
				}
				return this.$locale.baseText('templates.noSearchResults');
			}

			return null;
		},
		query(): ITemplatesQuery {
			return {
				categories: this.categories,
				search: this.search,
			};
		},
		nothingFound(): boolean {
			return (
				!this.loadingWorkflows &&
				!this.loadingCollections &&
				this.workflows.length === 0 &&
				this.collections.length === 0
			);
		},
		totalWorkflows(): number {
			return this.getSearchedWorkflowsTotal(this.query);
		},
		workflows(): ITemplatesWorkflow[] {
			return this.getSearchedWorkflows(this.query) || [];
		},
	},
	data() {
		return {
			areCategoriesPrepopulated: false,
			categories: [] as number[],
			loading: true,
			loadingCategories: true,
			loadingCollections: true,
			loadingWorkflows: true,
			search: '',
			searchEventToTrack: null as null | ISearchEvent,
			errorLoadingWorkflows: false,
		};
	},
	methods: {
		onOpenCollection({event, id}: {event: MouseEvent, id: string}) {
			this.navigateTo(event, 'TemplatesCollectionView', id);
		},
		onOpenTemplate({event, id}: {event: MouseEvent, id: string}) {
			this.navigateTo(event, 'TemplatesWorkflowView', id);
		},
		navigateTo(e: MouseEvent, page: string, id: string) {
			if (e.metaKey || e.ctrlKey) {
				const route = this.$router.resolve({ name: page, params: { id } });
				window.open(route.href, '_blank');
				return;
			} else {
				this.$router.push({ name: page, params: { id } });
			}
		},
		updateSearch() {
			this.updateQueryParam(this.search, this.categories.join(','));
			this.loadWorkflowsAndCollections(false);
		},
		updateSearchTracking(search: string, categories: number[]) {
			if (!search) {
				return;
			}
			if (this.searchEventToTrack && this.searchEventToTrack.search_string.length > search.length) {
				return;
			}

			this.searchEventToTrack = {
				search_string: search,
				workflow_results_count: this.getSearchedWorkflowsTotal({search, categories}),
				collection_results_count: this.getSearchedCollections({search, categories}).length,
				categories_applied: categories.map((categoryId) =>
					this.$store.getters['templates/getCategoryById'](categoryId),
				) as ITemplatesCategory[],
				wf_template_repo_session_id: this.$store.getters['templates/currentSessionId'],
			};
		},
		trackSearch() {
			if (this.searchEventToTrack) {
				this.$telemetry.track('User searched workflow templates', this.searchEventToTrack as unknown as IDataObject);
				this.searchEventToTrack = null;
			}
		},
		openNewWorkflow() {
			this.$router.push({ name: 'NodeViewNew' });
		},
		onSearchInput(search: string) {
			this.loadingWorkflows = true;
			this.loadingCollections = true;
			this.search = search;
			this.callDebounced('updateSearch', { debounceTime: 500, trailing: true });

			if (search.length === 0) {
				this.trackSearch();
			}
		},
		onCategorySelected(selected: number) {
			this.categories = this.categories.concat(selected);
			this.updateSearch();
			this.trackCategories();
		},
		onCategoryUnselected(selected: number) {
			this.categories = this.categories.filter((id) => id !== selected);
			this.updateSearch();
			this.trackCategories();
		},
		onCategoriesCleared() {
			this.categories = [];
			this.updateSearch();
		},
		trackCategories() {
			if (this.categories.length) {
				this.$telemetry.track('User changed template filters', {
					search_string: this.search,
					categories_applied: this.categories.map((categoryId: number) =>
						this.$store.getters['templates/getCategoryById'](categoryId),
					),
					wf_template_repo_session_id: this.$store.getters['templates/currentSessionId'],
				});
			}
		},
		updateQueryParam(search: string, category: string) {
			const query = Object.assign({}, this.$route.query);

			if (category.length) {
				query.categories = category;
			} else {
				delete query.categories;
			}

			if (search.length) {
				query.search = search;
			} else {
				delete query.search;
			}

			this.$router.replace({ query });
		},
		async onLoadMore() {
			if (this.workflows.length >= this.totalWorkflows) {
				return;
			}
			try {
				this.loadingWorkflows = true;
				await this.$store.dispatch('templates/getMoreWorkflows', {
					categories: this.categories,
					search: this.search,
				});
			} catch (e) {
				this.$showMessage({
					title: 'Error',
					message: 'Could not load more workflows',
					type: 'error',
				});
			} finally {
				this.loadingWorkflows = false;
			}
		},
		async loadCategories() {
			try {
				await this.$store.dispatch('templates/getCategories');
			} catch (e) {
			}

			this.loadingCategories = false;
		},
		async loadCollections() {
			try {
				this.loadingCollections = true;
				await this.$store.dispatch('templates/getCollections', {
					categories: this.categories,
					search: this.search,
				});
			} catch (e) {
			}

			this.loadingCollections = false;
		},
		async loadWorkflows() {
			try {
				this.loadingWorkflows = true;
				await this.$store.dispatch('templates/getWorkflows', {
					search: this.search,
					categories: this.categories,
				});
				this.errorLoadingWorkflows = false;
			} catch (e) {
				this.errorLoadingWorkflows = true;
			}

			this.loadingWorkflows = false;
		},
		async loadWorkflowsAndCollections(initialLoad: boolean) {
			const search = this.search;
			const categories = [...this.categories];
			await Promise.all([this.loadWorkflows(), this.loadCollections()]);
			if (!initialLoad) {
				this.updateSearchTracking(search, categories);
			}
		},
		scrollToTop() {
			setTimeout(() => {
				window.scrollTo({
					top: 0,
					behavior: 'smooth',
				});
			}, 100);
		},
	},
	watch: {
		workflows(newWorkflows) {
			if (newWorkflows.length === 0) {
				this.scrollToTop();
			}
		},
	},
	beforeRouteLeave(to, from, next) {
		this.trackSearch();
		next();
	},
	async mounted() {
		setPageTitle('n8n - Templates');
		this.loadCategories();
		this.loadWorkflowsAndCollections(true);
	},
	async created() {
		if (this.$route.query.search && typeof this.$route.query.search === 'string') {
			this.search = this.$route.query.search;
		}

		if (typeof this.$route.query.categories === 'string' && this.$route.query.categories.length) {
			this.categories = this.$route.query.categories.split(',').map((categoryId) => parseInt(categoryId, 10));
			this.areCategoriesPrepopulated = true;
		}
	},
});
</script>

<style lang="scss" module>
.wrapper {
	display: flex;
	justify-content: space-between;
}

.contentWrapper {
	display: flex;
	justify-content: space-between;

	@media (max-width: $--breakpoint-xs) {
		flex-direction: column;
	}
}

.filters {
	width: 200px;
	margin-bottom: var(--spacing-xl);
}

.search {
	width: 100%;
	padding-left: var(--spacing-2xl);

	> * {
		margin-bottom: var(--spacing-l);
	}

	@media (max-width: $--breakpoint-xs) {
		padding-left: 0;
	}
}

.header {
	margin-bottom: var(--spacing-2xs);
}

</style>
