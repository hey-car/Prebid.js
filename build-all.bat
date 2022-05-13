md build-output

call gulp build --modules=modules-hj.json
copy build\dist\prebid.js build-output\prebid-hj.js

call gulp build --modules=modules-ds.json
copy build\dist\prebid.js build-output\prebid-ds.js

call gulp build --modules=modules-csn.json
copy build\dist\prebid.js build-output\prebid-csn.js