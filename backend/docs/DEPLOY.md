# Deploy to Cloud

Deploy the functions to cloud
Install: `gcloud cli`

Make sure that you are logged in and are on the right project.
To check which project you are on just run: `gcloud config get-value project`
To list all the projects you have: `gcloud projects list`
To switch to a project: `gcloud config set project [PROJECT_ID]`

Run: 
`gcloud functions deploy <name_the_function> --runtime=python312 --source=<path to src> --entry-point=<entry-point> --trigger-http --allow-unauthenticated --timeout=TIMEOUT_DURATION`
Example
`gcloud functions deploy get_global_resturant_for_group --runtime=python312 --source=. --entry-point=get_resturant_for_group --trigger-http --allow-unauthenticated --timeout=500`

Note: Keep in mind timeouts, the city_itinerary takes longer