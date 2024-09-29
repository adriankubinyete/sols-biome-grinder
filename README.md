heavily work in progress

i dont know what will happen if you run it outside of my own specs, be careful

biome detection reliability is average 80%
no false-positives as of now (about #1000 server rolls)

Really crude setup guide:

ASSUMPTIONS: 
- Your screen resolution is 1920x1080, 16:9.
- You're using Windows 11, and the task bar is in the inferior part of the screen.
- Your Roblox boots in full screen.
-# I will eventually fix it enough so you can run it with any system you want.

Firstly, the application is written entirely in NodeJS (v20.17.0). You will need to download the appropriate programming language for it to work.
https://nodejs.org/en/download/prebuilt-installer

After you set up NodeJS, you must obtain these informations:
- Your private server URL (same one you use on dolphsols)
- An discord webhook to send notifications
- An discord USERID to ping

Then, you must pull this git repository

Download as zip file. Extract to wherever you want.
Enter the folder. 

First things first, make a copy of .env.template, and rename it to .env.dev
Edit it and put your information. You only need to fill the server URL, webhook and user ping.

Back to the folder, right click and open your folder in terminal.
Assert your NodeJS is avaliable using typing "node -v" first.
Run "npm install" so you install the dependencies.
Run "npm run tests" so you execute the testing routine.
Run "npm run dev" so you actually run the application.
