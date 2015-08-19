##
##  rookDiffPriv
##
##  Rook code for starting rook server and sourcing in apps
##  The apps themselves are found in rookPrivate.R
##
##  12/11/14 jH
##

production<-FALSE     ## Toggle:  TRUE - Production, FALSE - Local Development

packageList<-c("Rook","jsonlite") #,"rjson")
for(i in 1:length(packageList)){
    if (!require(packageList[i],character.only = TRUE)){
        install.packages(packageList[i], repos="http://lib.stat.cmu.edu/R/CRAN/")
    }
}

#update.packages(ask = FALSE, dependencies = c('Suggests'), oldPkgs=packageList, repos="http://lib.stat.cmu.edu/R/CRAN/")


library(Rook)
library(jsonlite)


## Get the server connection set up

if(!production){
    myPort <- "8000"
    myInterface <- "0.0.0.0"
    status <- -1
    status<-.Call(tools:::startHTTPD, myInterface, myPort)
    
    
    if( status!=0 ){
        print("WARNING: Error setting interface or port")
        stop()
    }
    
    R.server <- Rhttpd$new()
    
    cat("Type:", typeof(R.server), "Class:", class(R.server))
    R.server$add(app = privateStatistics.app, name="privateStatistics")
    R.server$add(app = privateStatistics.app, name="privateAccuracies")

    R.server$add(app = File$new(getwd()), name = "pic_dir")
    print(R.server)
    
    R.server$start(listen=myInterface, port=myPort)
    R.server$listenAddr <- myInterface
    R.server$listenPort <- myPort
}
    
source("rookprivate.R")

if(!production){
    R.server$add(app = privateAccuracies.app, name = "privateAccuracies")
    R.server$add(app = privateStatistics.app, name = "privateStatistics")
    print(R.server)
}


# Other useful commands (see also "myrookrestart.R"):
#R.server$browse("myrookapp")
#R.server$stop()
#R.server$remove(all=TRUE)
