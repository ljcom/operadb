#install
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0

#run
mongod --dbpath /usr/local/var/mongodb

#auto run
mkdir -p ~/data/db
mongod --dbpath ~/data/db
