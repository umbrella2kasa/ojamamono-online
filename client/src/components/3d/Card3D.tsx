import * as THREE from 'three';
import type { PathCard } from '@ojamamono/shared';

export function createCard3DMesh(card: PathCard, size: number, isReversed: boolean = false): THREE.Group {
    const group = new THREE.Group();

    // カードベースの作成
    const cardGeometry = new THREE.BoxGeometry(size * 0.8, 0.1, size * 0.8);

    // カードの色とマテリアルを決定
    let cardMaterial: THREE.MeshStandardMaterial;

    if (card.isStart) {
        // スタートカード：緑の発光
        cardMaterial = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0x22c55e,
            emissiveIntensity: 0.4,
        });
    } else if (card.isGoal) {
        // ゴールカード
        const isGold = card.isRevealed && card.goalType === 'GOLD';
        const isStone = card.isRevealed && card.goalType === 'STONE';

        cardMaterial = new THREE.MeshStandardMaterial({
            color: isGold ? 0xfbbf24 : isStone ? 0x9ca3af : 0x6b7280,
            metalness: isGold ? 0.8 : 0.4,
            roughness: isGold ? 0.2 : 0.6,
            emissive: isGold ? 0xfbbf24 : 0x000000,
            emissiveIntensity: isGold ? 0.3 : 0,
        });
    } else {
        // 通常の道カード：木目風
        cardMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            metalness: 0.1,
            roughness: 0.8,
        });
    }

    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
    cardMesh.castShadow = true;
    cardMesh.receiveShadow = true;
    group.add(cardMesh);

    // カードの縁（ハイライト）
    const edgeGeometry = new THREE.BoxGeometry(size * 0.82, 0.11, size * 0.82);
    const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3f35,
        metalness: 0.6,
        roughness: 0.4,
    });
    const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edgeMesh.position.y = -0.001;
    group.add(edgeMesh);

    // 道の形状を表示（PATH カードの場合）
    if (!card.isStart && !card.isGoal) {
        const pathWidth = size * 0.25;
        const pathHeight = 0.2;
        const pathColor = card.shape.center ? 0x60a5fa : 0xef4444; // 青（道）/ 赤（行き止まり）

        // グラデーション効果のための2層構造
        const pathMaterialBase = new THREE.MeshStandardMaterial({
            color: pathColor,
            metalness: 0.7,
            roughness: 0.3,
            emissive: pathColor,
            emissiveIntensity: 0.6,
        });

        const pathMaterialHighlight = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.9,
            roughness: 0.1,
            emissive: pathColor,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.4,
        });

        // 中央の接続部分
        if (card.shape.center) {
            const centerGeometry = new THREE.CylinderGeometry(pathWidth, pathWidth, pathHeight, 16);
            const centerMesh = new THREE.Mesh(centerGeometry, pathMaterialBase);
            centerMesh.position.y = pathHeight / 2 + 0.06;
            group.add(centerMesh);

            // ハイライト
            const centerHighlight = new THREE.CylinderGeometry(pathWidth * 0.7, pathWidth * 0.7, pathHeight + 0.01, 16);
            const centerHighlightMesh = new THREE.Mesh(centerHighlight, pathMaterialHighlight);
            centerHighlightMesh.position.y = pathHeight / 2 + 0.07;
            group.add(centerHighlightMesh);
        }

        // 道のセグメントを作成するヘルパー関数
        const createPathSegment = (direction: 'top' | 'bottom' | 'left' | 'right') => {
            let position: [number, number, number];
            let dimensions: [number, number, number];

            switch (direction) {
                case 'top':
                    position = [0, pathHeight / 2 + 0.05, -size * 0.2];
                    dimensions = [pathWidth, pathHeight, size * 0.4];
                    break;
                case 'bottom':
                    position = [0, pathHeight / 2 + 0.05, size * 0.2];
                    dimensions = [pathWidth, pathHeight, size * 0.4];
                    break;
                case 'left':
                    position = [-size * 0.2, pathHeight / 2 + 0.05, 0];
                    dimensions = [size * 0.4, pathHeight, pathWidth];
                    break;
                case 'right':
                    position = [size * 0.2, pathHeight / 2 + 0.05, 0];
                    dimensions = [size * 0.4, pathHeight, pathWidth];
                    break;
            }

            // ベース
            const segmentGeometry = new THREE.BoxGeometry(...dimensions);
            const segmentMesh = new THREE.Mesh(segmentGeometry, pathMaterialBase);
            segmentMesh.position.set(...position);
            group.add(segmentMesh);

            // ハイライト
            const highlightDimensions: [number, number, number] = [
                dimensions[0] * 0.7,
                dimensions[1] + 0.01,
                dimensions[2] * 0.7
            ];
            const highlightGeometry = new THREE.BoxGeometry(...highlightDimensions);
            const highlightMesh = new THREE.Mesh(highlightGeometry, pathMaterialHighlight);
            highlightMesh.position.set(position[0], position[1] + 0.01, position[2]);
            group.add(highlightMesh);
        };

        // 各方向の道を作成
        if (card.shape.top) createPathSegment('top');
        if (card.shape.bottom) createPathSegment('bottom');
        if (card.shape.left) createPathSegment('left');
        if (card.shape.right) createPathSegment('right');
    }

    // 反転状態
    if (isReversed) {
        group.rotation.z = Math.PI;
    }

    return group;
}
