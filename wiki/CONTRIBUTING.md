In order to be able to contribute:
- You would need to respect the code style enforced by the ESLint configuration
file found in the _cfg/_ folder, you can do that by using `npm run lint` on your JS files.
- You would need to document your code using JSDoc comments with optional different types of comments
when relevant and necessary, this can be done by using `npm run doc`.
- You would also need to create test suites for the code you changed/added while ensuring all test files
passes after running `npm test`.

It's also recommended to make use of `nsp check` or other security tools to verify if the dependencies or/and
the code has any vulnerabilities.

Note: you may get security warnings from ESLint which may not pause a problem (i.e. false positive)
and I would suggest you to fix those (if possible) otherwise raise it as an issue.