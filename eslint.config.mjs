const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];

export default eslintConfig;
