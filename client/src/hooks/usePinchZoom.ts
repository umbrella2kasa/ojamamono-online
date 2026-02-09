import { useRef, useEffect } from 'react';

interface UsePinchZoomOptions {
    minZoom?: number;
    maxZoom?: number;
    sensitivity?: number;
}

export function usePinchZoom(
    ref: React.RefObject<HTMLElement>,
    currentZoom: number,
    setZoom: (zoom: number) => void,
    options: UsePinchZoomOptions = {}
) {
    const { minZoom = 0.5, maxZoom = 2.0, sensitivity = 1 } = options;

    // Store mutable values in refs to avoid re-creating listeners on every render
    const state = useRef({
        startDistance: 0,
        startZoom: currentZoom,
        isPinching: false,
    });

    // Update the startZoom whenever external zoom changes (e.g. via buttons)
    // ONLY if we are NOT currently pinching, to avoid feedback loops
    useEffect(() => {
        if (!state.current.isPinching) {
            state.current.startZoom = currentZoom;
        }
    }, [currentZoom]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const getDistance = (touches: React.TouchList | TouchList) => {
            if (touches.length < 2) return 0;
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.hypot(dx, dy);
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                // e.preventDefault(); // Prevent default browser zoom if needed
                state.current.isPinching = true;
                state.current.startDistance = getDistance(e.touches);
                state.current.startZoom = currentZoom;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (state.current.isPinching && e.touches.length === 2) {
                // e.preventDefault(); // Crucial to prevent page scrolling/zooming while pinching

                const currentDistance = getDistance(e.touches);
                if (state.current.startDistance > 0) {
                    const scale = currentDistance / state.current.startDistance;

                    // New zoom = starting zoom * scale factor
                    // Adjusted by sensitivity if needed (though direct ratio is usually best for pinch)
                    let newZoom = state.current.startZoom * scale;

                    // Clamp
                    newZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);

                    setZoom(newZoom);
                }
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (state.current.isPinching && e.touches.length < 2) {
                state.current.isPinching = false;
                // Final zoom is already set in state via setZoom
            }
        };

        // Use { passive: false } to allow preventDefault if we uncomment it
        // However, for game board, we often want to allow partial scrolling if not pinching
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [ref, setZoom, minZoom, maxZoom, sensitivity]); // Re-bind if options change
}
