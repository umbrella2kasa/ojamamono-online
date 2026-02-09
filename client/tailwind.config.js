/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            gridTemplateColumns: {
                '11': 'repeat(11, minmax(0, 1fr))',
                '13': 'repeat(13, minmax(0, 1fr))',
                '17': 'repeat(17, minmax(0, 1fr))',
            }
        },
    },
    plugins: [],
}
