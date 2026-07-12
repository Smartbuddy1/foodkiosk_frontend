export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                cambria: ["Cambria", "Georgia", "serif"]
            },
            colors: {
                ink: "#0F172A",
                ember: "#C2410C",
                bun: "#EAB308",
                leaf: "#15803D",
                cream: "#FAF9F6",
                steel: "#475569"
            },
            boxShadow: {
                kiosk: "0 18px 45px rgba(24, 18, 12, 0.16)"
            }
        }
    },
    plugins: []
};
