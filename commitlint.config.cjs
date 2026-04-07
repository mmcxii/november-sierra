module.exports = {
  parserPreset: {
    parserOpts: {
      headerCorrespondence: ["ticket", "type", "scope", "subject"],
      headerPattern: /^((?:ANC|NS)-\d+):\s(\w+)(?:\(([^)]*)\))?!?:\s(.+)$/,
    },
  },
  plugins: [
    {
      rules: {
        "header-match-team-pattern": (parsed) => {
          const { header } = parsed;
          const pattern =
            /^(?:ANC|NS)-\d+:\s(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?:\s.+/;

          if (!pattern.test(header)) {
            return [false, "Header must match: ANC-XXX: type(scope): subject  or  NS-XXX: type(scope): subject"];
          }
          return [true, ""];
        },
      },
    },
  ],
  rules: {
    "header-match-team-pattern": [2, "always"],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"],
    ],
  },
};
