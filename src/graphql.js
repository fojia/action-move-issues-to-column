const {graphql} = require("@octokit/graphql");
let instance = null;

class graphqlApi {
    constructor(token) {
        this.token = token;
    }

    static init(token) {
        if (!instance) {
            instance = new graphqlApi(token);
        }
        return instance;
    }

    static query(q, params) {
        return graphql(q, {...{headers: {authorization: `bearer ${instance.token}`}}, ...params});
    }
}

module.exports = graphqlApi;
