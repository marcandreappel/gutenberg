/**
 * External dependencies
 */
import {
	KeyboardAvoidingView as IOSKeyboardAvoidingView,
	Animated,
	Keyboard,
	Dimensions,
	View,
} from 'react-native';
import SafeArea from 'react-native-safe-area';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const AnimatedKeyboardAvoidingView = Animated.createAnimatedComponent(
	IOSKeyboardAvoidingView
);

const MIN_HEIGHT = 44;

export const KeyboardAvoidingView = ( {
	parentHeight,
	style,
	withAnimatedHeight = false,
	...otherProps
} ) => {
	const [ resizeObserver, sizes ] = useResizeObserver();
	const [ isKeyboardOpen, setIsKeyboardOpen ] = useState( false );
	const [ safeAreaBottomInset, setSafeAreaBottomInset ] = useState( 0 );
	const { height = 0 } = sizes || {};

	const animatedHeight = useRef( new Animated.Value( MIN_HEIGHT ) ).current;

	const { height: fullHeight } = Dimensions.get( 'window' );
	const keyboardVerticalOffset = fullHeight - parentHeight;

	useEffect( () => {
		SafeArea.getSafeAreaInsetsForRootView().then(
			( { safeAreaInsets } ) => {
				setSafeAreaBottomInset( safeAreaInsets.bottom );
			}
		);
		SafeArea.addEventListener(
			'safeAreaInsetsForRootViewDidChange',
			onSafeAreaInsetsUpdate
		);
		Keyboard.addListener( 'keyboardWillShow', onKeyboardWillShow );
		Keyboard.addListener( 'keyboardWillHide', onKeyboardWillHide );

		return () => {
			SafeArea.removeEventListener(
				'safeAreaInsetsForRootViewDidChange',
				onSafeAreaInsetsUpdate
			);
			Keyboard.removeListener( 'keyboardWillShow', onKeyboardWillShow );
			Keyboard.removeListener( 'keyboardWillHide', onKeyboardWillHide );
		};
	}, [] );

	function onSafeAreaInsetsUpdate( { safeAreaInsets } ) {
		setSafeAreaBottomInset( safeAreaInsets.bottom );
	}

	function onKeyboardWillShow( { endCoordinates } ) {
		setIsKeyboardOpen( true );
		animatedHeight.setValue( endCoordinates.height + MIN_HEIGHT );
	}

	function onKeyboardWillHide( { duration, startCoordinates } ) {
		const animatedListenerId = animatedHeight.addListener(
			( { value } ) => {
				if ( value < startCoordinates.height / 3 ) {
					setIsKeyboardOpen( false );
				}
			}
		);

		Animated.timing( animatedHeight, {
			toValue: MIN_HEIGHT,
			duration,
			useNativeDriver: false,
		} ).start( () => {
			animatedHeight.removeListener( animatedListenerId );
		} );
	}

	return (
		<AnimatedKeyboardAvoidingView
			{ ...otherProps }
			behavior="padding"
			keyboardVerticalOffset={ keyboardVerticalOffset }
			style={
				withAnimatedHeight
					? [
							style,
							{
								height: animatedHeight,
								marginBottom: isKeyboardOpen
									? -safeAreaBottomInset
									: 0,
							},
					  ]
					: style
			}
		>
			<View
				style={ [
					{
						top: -height + MIN_HEIGHT,
					},
					styles.animatedChildStyle,
					! withAnimatedHeight && styles.defaultChildStyle,
				] }
			>
				{ resizeObserver }
				{ otherProps.children }
			</View>
		</AnimatedKeyboardAvoidingView>
	);
};

export default KeyboardAvoidingView;