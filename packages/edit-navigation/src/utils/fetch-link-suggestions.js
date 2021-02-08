/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * External dependencies
 */
import { flatten, slice, map as _map, flow } from 'lodash';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

// curried map operator with flipped arguments
const map = ( mapFunction ) => ( array ) => _map( array, mapFunction );
const toSuggestionLinkObj = ( { id, url, title, subType, type } ) => ( {
	id,
	url,
	title: decodeEntities( title ) || __( '(no title)' ),
	type: subType || type,
} );
/**
 * Fetches link suggestions from the API. This function is an exact copy of a function found at:
 *
 * packages/editor/src/components/provider/index.js
 *
 * It seems like there is no suitable package to import this from. Ideally it would be either part of core-data.
 * Until we refactor it, just copying the code is the simplest solution.
 *
 * @param {string} search
 * @param {Object} [searchArguments]
 * @param {number} [searchArguments.isInitialSuggestions]
 * @param {number} [searchArguments.type]
 * @param {number} [searchArguments.subtype]
 * @param {Object} [editorSettings]
 * @param {boolean} [editorSettings.disablePostFormats=false]
 * @return {Promise<Object[]>} List of suggestions
 */
export default (
	search,
	{ isInitialSuggestions, type, subtype } = {},
	{ disablePostFormats = false } = {}
) => {
	const perPage = isInitialSuggestions ? 3 : 20;

	const linkTypes = [ 'post', 'term' ];
	if ( ! disablePostFormats ) linkTypes.push( 'post-format' );

	const typesOfLinksToFetch = type ? [ type ] : linkTypes;

	const toApiFetchBody = ( linkType ) => ( {
		path: addQueryArgs( '/wp/v2/search', {
			search,
			per_page: perPage,
			type: linkType,
			subtype,
		} ),
	} );

	// assign piped functions producing api call
	const toReqBody = flow( [
		toApiFetchBody,
		apiFetch,
		( promise ) => promise.catch( () => [] ),
	] );
	// assign piped functions producing suggestion links objects from server response data
	const toSuggestionLinksObjects = flow( [
		flatten,
		( x ) => slice( x, 0, perPage ),
		toSuggestionLinkObj,
	] );
	// compose curried map operators to produce suggestion links objects for every type of link
	return flow( [
		map( toReqBody ),
		map( async ( x ) => await x ),
		map( toSuggestionLinksObjects ),
	] )( typesOfLinksToFetch );
};
