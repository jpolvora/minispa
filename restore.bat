pushd src
nuget restore -PackagesDirectory ../packages
md bin
popd
copy packages\*.dll src\bin
