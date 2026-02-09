export function SimpleTest() {
    return (
        <div style={{ padding: '20px', background: '#1e2740', minHeight: '100vh', color: 'white' }}>
            <h1>テストページ</h1>
            <p>このページが表示されていれば、Reactは正常に動作しています。</p>
            <button
                onClick={() => alert('ボタンが動作しています！')}
                style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
            >
                クリックしてテスト
            </button>
        </div>
    );
}
