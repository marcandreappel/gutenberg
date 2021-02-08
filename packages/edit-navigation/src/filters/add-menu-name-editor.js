/**
 * WordPress dependencies
 */
/**
 * Internal dependencies
 */
import { NameEditor, useNavigationEditorMenu } from '../components/name-editor';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

const addMenuNameEditor = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}
		const { saveMenu, menuName } = useNavigationEditorMenu();
		const NavigationBlockEdit = () =>
			props.name !== 'core/navigation' ? (
				<BlockEdit { ...props } />
			) : (
				<BlockEdit
					{ ...props }
					saveMenu={ saveMenu }
					menuName={ menuName }
				/>
			);
		return (
			<>
				<NavigationBlockEdit />
				<NameEditor { ...props } />;
			</>
		);
	},
	'withMenuName'
);

export default () =>
	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/with-menu-name',
		addMenuNameEditor
	);
