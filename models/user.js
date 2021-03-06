const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const UserSchema = mongoose.Schema({
  displayName: { type: String, required: true },
  facebookId: { type: String, unique: true },
  githubId: { type: String, unique: true },
  passportModules: { 
  	type: [{ name: String, connected: Boolean, token: String, username: String}],
  	default: [{name: "Facebook", connected: false }, {name: "Github", connected: false}] 
  }
});

UserSchema.plugin(uniqueValidator);

UserSchema.methods.getModuleInfo = function(moduleName) {
    return this.passportModules.find((module) => {
			return module.name === moduleName;
		});
};



const User = mongoose.model("User", UserSchema);

module.exports = User;