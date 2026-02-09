import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { GameState } from '@ojamamono/shared';
import { createCard3DMesh } from './Card3D';

interface GameBoard3DProps {
    gameState: GameState;
    onCellClick: (index: number) => void;
    selectedCardIndex: number | null;
    interactionMode: 'NORMAL' | 'SELECT_PLAYER' | 'SELECT_GOAL' | 'SELECT_ROCKFALL' | 'DISCARD';
}

// export function GameBoard3D({ gameState, onCellClick, selectedCardIndex, interactionMode }: GameBoard3DProps) {
export function GameBoard3D({ gameState, onCellClick, selectedCardIndex: _s, interactionMode: _i }: GameBoard3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cardMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // シーン、カメラ、レンダラーのセットアップ
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e1a);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(0, 12, 16);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // ライティング
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0xf59838, 0.3);
        pointLight1.position.set(-10, 5, -5);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffcc2e, 0.3);
        pointLight2.position.set(10, 5, 5);
        scene.add(pointLight2);

        // ゲームボードの作成
        const cellSize = 1.2;
        const boardWidth = gameState.gridWidth * cellSize;
        const boardHeight = gameState.gridHeight * cellSize;

        // ボード本体
        const boardGeometry = new THREE.BoxGeometry(boardWidth + 1, 0.5, boardHeight + 1);
        const boardMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e2740,
            metalness: 0.3,
            roughness: 0.7,
        });
        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.position.y = -0.25;
        board.receiveShadow = true;
        scene.add(board);

        // ボードの縁
        const borderGeometry = new THREE.BoxGeometry(boardWidth + 1.2, 0.3, boardHeight + 1.2);
        const borderMaterial = new THREE.MeshStandardMaterial({
            color: 0xf59838,
            metalness: 0.6,
            roughness: 0.4,
            emissive: 0xf59838,
            emissiveIntensity: 0.2,
        });
        const border = new THREE.Mesh(borderGeometry, borderMaterial);
        border.position.y = 0;
        scene.add(border);

        // グリッドセルとカード
        const cellGroup = new THREE.Group();
        gameState.grid.forEach((cell, index) => {
            const x = (index % gameState.gridWidth);
            const y = Math.floor(index / gameState.gridWidth);
            const posX = (x - (gameState.gridWidth - 1) / 2) * cellSize;
            const posZ = (y - (gameState.gridHeight - 1) / 2) * cellSize;

            // セルの背景
            const cellGeometry = new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9);
            const cellMaterial = new THREE.MeshStandardMaterial({
                color: 0x1e2740,
                transparent: true,
                opacity: 0.3,
                metalness: 0.5,
                roughness: 0.5,
                side: THREE.DoubleSide,
            });
            const cellMesh = new THREE.Mesh(cellGeometry, cellMaterial);
            cellMesh.position.set(posX, 0.01, posZ);
            cellMesh.rotation.x = -Math.PI / 2;
            cellMesh.userData = { index, type: 'cell' };
            cellGroup.add(cellMesh);

            // カードが配置されている場合
            if (cell) {
                const cardGroup = createCard3DMesh(cell.card, cellSize, cell.isReversed);
                cardGroup.position.set(posX, 0.5, posZ);
                cardGroup.userData = { index, type: 'card' };
                cardMeshesRef.current.set(index, cardGroup as any);
                scene.add(cardGroup);
            }
        });
        scene.add(cellGroup);

        // グリッド線
        const gridLinesMaterial = new THREE.MeshBasicMaterial({ color: 0x3d4a7c });

        // 横線
        for (let i = 0; i <= gameState.gridHeight; i++) {
            const z = (i - gameState.gridHeight / 2) * cellSize;
            const lineGeometry = new THREE.BoxGeometry(boardWidth, 0.01, 0.02);
            const line = new THREE.Mesh(lineGeometry, gridLinesMaterial);
            line.position.set(0, 0.02, z);
            scene.add(line);
        }

        // 縦線
        for (let i = 0; i <= gameState.gridWidth; i++) {
            const x = (i - gameState.gridWidth / 2) * cellSize;
            const lineGeometry = new THREE.BoxGeometry(0.02, 0.01, boardHeight);
            const line = new THREE.Mesh(lineGeometry, gridLinesMaterial);
            line.position.set(x, 0.02, 0);
            scene.add(line);
        }

        // レイキャスター（クリック検出用）
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onClick = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([...cellGroup.children, ...Array.from(cardMeshesRef.current.values())]);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                if (clickedObject.userData.index !== undefined) {
                    onCellClick(clickedObject.userData.index);
                }
            }
        };

        // マウスコントロール
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const rotationSpeed = 0.005;

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            scene.rotation.y += deltaX * rotationSpeed;
            scene.rotation.x += deltaY * rotationSpeed;

            // X軸の回転を制限
            scene.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, scene.rotation.x));

            previousMousePosition = { x: e.clientX, y: e.clientY };
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            camera.position.z += e.deltaY * 0.01;
            camera.position.z = Math.max(10, Math.min(25, camera.position.z));
        };

        renderer.domElement.addEventListener('click', onClick);
        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('wheel', onWheel);

        // アニメーションループ
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        // リサイズハンドラ
        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        // クリーンアップ
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('click', onClick);
            renderer.domElement.removeEventListener('mousedown', onMouseDown);
            renderer.domElement.removeEventListener('mousemove', onMouseMove);
            renderer.domElement.removeEventListener('mouseup', onMouseUp);
            renderer.domElement.removeEventListener('wheel', onWheel);
            container.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, [gameState, onCellClick]);

    return <div ref={containerRef} className="w-full h-full" />;
}
