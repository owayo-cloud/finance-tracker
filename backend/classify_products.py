import pandas as pd

# List of products provided by the user
products = [
"2 Share Sweet  Red 750Ml","2 Share Sweet White 750Ml","4Th Street Red 5 Litres","4Th Street Red 750Ml","4Th Street White 5 Litres",
"4Th Street White 750Ml","5.8 Classic Gin 350Ml","5.8 Classic Gin 750Ml","8 Pm Original 750Ml","Absolute Vodka Blue 750Ml",
"Ace Black 750Ml","Allen Water Premium 1L","All Seasons 1 Litre","All Seasons 250Ml","All Seasons 375Ml","All Seasons 500Ml",
"All Seasons 750Ml","Alter Wine  Import 750Ml","Amarula 750Ml","Amarula Cream 1L","Angostura 200Ml","Asconi 750Ml","Aspera Gin 250Ml",
"Aspera Gin750Ml","Atlas 14% Can 500Ml","Atlas16%  Can 500Ml","Avalon Gin 250Ml","Bacardi Clear 750Ml","Bacardi Gold 750Ml",
"Backbencher Whiskey 750Ml","Baileys Cream 1L","Baileys Delight 750Ml","Baileys Original 350Ml","Baileys Original 750Ml",
"Ballantines 750Ml","Balozi Btl","Balozi Can 500Ml","Banana Beer 500Ml","Beefeater 750Ml","Belaire Gold 750Ml","Belaire Lux 750Ml",
"Belaire Rose 750Ml","Best Cream 250Ml","Best Cream 750Ml","Best Gin 250Ml","Best Gin 750Ml","Best Vodka 250Ml","Best Vodka 750Ml",
"Best Whiskey 250Ml","Best Whiskey 750Ml","Bianco Nobile Vaniglia 750Ml","Black And White 250Ml","Black Bird Wine 750Ml",
"Black Ice Smirnoff Bottle","Black Ice Smirnoff Can","Black&White 1Litre","Black & White 350Ml","Black &White 750Ml","Blue Ice 0.25 Tot",
"Blue Ice 250Ml","Blue Ice 750Ml","Blue Ice Coconut 250Ml","Blue Ice Coconut 750Ml","Bols Blue Curacao 750Ml","Bols Triple Sec",
"Bombay Sapphire 750Ml","Bond 007 250Ml","Bond 007 350Ml","Bond 007 750Ml","Bovinae Energy Drink 330Ml","Bravado Energy","Bubble Up",
"Bulleit Bourbon 750Ml","Butlers  Tripple Sec750Ml","Buttlers Blue Curacao 750Ml","Camino Clear 750Ml","Camino Gold 700Ml",
"Campari 750Ml","Caprice 1Litre","Captain Cola Bottle","Captain Morgan 250Ml","Captain Morgan 750Ml","Captain Morgan Dark  Rum 750Ml",
"Captain Morgan Gold And Cola Can","Captain Spiced 1L","Captain Spiced 750Ml","Caribia Gin 250Ml","Caribia Gin 350Ml","Caribia Gin 750Ml",
"Casa Buena 1L","Cellar  Cask Red 5L","Cellar Cask Red 750Ml","Cellar Cask White 750Ml","Chamdor Red 750Ml","Chamdor White 750Ml",
"Chivas Regal 750Ml","Chrome Gin 0.25 Tot","Chrome Gin250Ml","Chrome Gin 750Ml","Chrome Lemon 250Ml","Chrome Vodka 0.25 Tot",
"Chrome Vodka 250Ml","Chrome Vodka 750Ml","Cicero Brandy 250Ml","Ciroc Vodka 750Ml","Classic/Tambuzi Gin 750Ml","Club Lemonade",
"Club Man 250Ml","Club Man 750Ml","County 0.25 Tot","County 250Ml","County 750Ml","Crazy Cock 250Ml","Crazy Cock 350Ml",
"Crazy Cock 750Ml","Delmonte 1 Litre","Desparado 330Ml","Drostdy Hof White 750Ml","Drostydy Hof Red  750Ml","Dunhill D. Cig Pcs",
"Dunhill D.Switch","Dunhill S.Switch","Embassy","Embassy Cig. Pcs","Famouse Grouse 750Ml","Famous Grouse 1L","Faxe Can",
"Ferari Ice Can","Flirt Vodka 1 Litre","Flirt Vodka 350Ml","Flirt Vodka 750Ml","Four Cousins Sweet Red 750Ml",
"Four Cousins Sweet White 750Ml","Frontera Shiraz 750Ml","General Meakings 0.25 Tot","General Meakings 250Ml","General Meakings 750Ml",
"Gentleman Jack 700Ml","Gibsons Dry Gin 750Ml","Gibsons Pink 700Ml","Gilbeys 350Ml","Gilbeys 750Ml","Gilbeys Gin 1 Litre",
"Gilbeys Gin 250Ml","Glenfiddich 12 Years","Glenfidich 15 Years","Glenlivet 12 Years 750Ml","Glenlivet 15 Year 700Ml",
"Gordons Dry 350Ml","Gordons Dry Gin 1L","Gordons  Dry Gin 750Ml","Gordons Pink 700Ml","Gordons Pink Tonic Can 330Ml",
"Gordons Tonic Can 330Ml","Grants 1 Litre","Grants 350Ml","Grants 750Ml","Grants 750Ml(With Glass)","Graysons Whiskey 750Ml",
"Grayson Whiskey 250Ml","Guinness Bottle","Guinness Can 500Ml","Guinness Smooth Btl 300Ml","Guinness Smooth Can 500Ml",
"Hampton Dram Whiskey 750Ml","Heineken Bottle330Ml","Heineken Can 500Ml","Heineken  Zero Bottle","Hendricks Gin 700Ml",
"Hennessy V.S 750Ml","Hennessy V.S.O.P 750Ml","Hunters Choice 0.25 Tot","Hunters Choice 250Ml","Hunters Choice 350Ml",
"Hunters Choice 750Ml","Hunters Dry 330Ml","Hunters Gold 330Ml","Imperial Blue 250Ml","Imperial Blue 375Ml","Imperial Blue 750Ml",
"Jack Daniel Honey 1L","Jack Daniels 1 Litre","Jack Daniels 375Ml","Jack Daniels 700Ml","Jack Daniels Can 330Ml",
"Jagermeister 700Ml","Jameson 1 Litre","Jameson  350Ml","Jameson 750Ml","Jameson Blackbarrel 750Ml","J & B 750Ml","Jim Beam 1L",
"Jose Cuervo Gold 750Ml","Jose Cuervo Silver 750Ml","Kc Lemon & Ginger 250Ml","Kc Pineapple 250Ml","Kc Smooth 250Ml",
"Kc Smooth 750Ml","Kenya King 250Ml","Kenya King 750Ml","Kibao Gin 250Ml","Kibao Gin 750Ml","Kibao Vodka 250Ml","Kibao Vodka 750Ml",
"Konyagi 250Ml","Konyagi 500Ml","Konyagi 750Ml","Lion Extra Strong (12%)","Malibu 1 Litre","Malibu 750Ml","Manyatta Cider  300Ml",
"Martel Blue Swift 700Ml","Martell Vs. 700Ml","Martell Vsop 750Ml","Martens Beer  500Ml (10%)","Martens Beer  500Ml (16%)",
"Martini Bianco 750Ml","Martini Rosso 750Ml","Mikado Sweet Red 750Ml","Mikado  Sweet White 750Ml","Monster","Napoleon 750Ml",
"Napoleon Crown Brandy 750Ml","Nederburg Chardonnay 750Ml","Novida Soda 350Ml","Old Monk 1L","Old Monk 750Ml",
"Olmeca Tequila Blanco 700Ml","Orijin Bitters 250Ml","Pierre Marcel Sweet Red 750Ml","Pierre Marcel Sweet White 750Ml",
"Pilsner Bottle 500Ml","Pilsner Can 500Ml","Power Play 400Ml","Redbull","Richot 750Ml","Robertson Red 750Ml","Robertson White 750Ml",
"Rosso Cherry 750Ml","Rosso Marzipan 750Ml","Safari Cig Pcs","Savanna Premium Cider Dry 350Ml","Smirnoff Vodka 750Ml",
"Snapp Dry Cider Btl 300Ml","Snapp Dry Can 330Ml","Southern Comfort 750Ml","Sportsman Cig Pcs","Tanquery Dry Gin 750Ml",
"Tusker Cider Bottle","Tusker Lager Bottle","Tusker Malt Can","Vat 69 750Ml","Viceroy 750Ml","Waragi 750Ml","White Cap Can",
"William Lawsons 750Ml","Zappa Clear 750Ml"
]

# Define keywords for each category
categories = {
    "Whisky": ["whiskey", "whisky", "scotch", "bourbon", "jack daniel", "j&b", "j.w", "john barr", "grants", "ballantines", "vat 69", "famous grouse", "tullamore", "william lawson", "hunting lodge", "gentleman jack"],
    "Vodka": ["vodka", "ciroc", "absolute", "chrome vodka", "flirt", "best vodka", "kibao vodka", "supreme vodka"],
    "Wine": ["wine", "sweet red", "sweet white", "cellar cask", "drostdy hof", "four cousins", "frontera", "robertson", "pierre marcel", "mikado", "nederburg"],
    "Champagne": ["belaire", "chamdor"],
    "Cognac & Brandy": ["brandy", "hennessy", "martell", "viceroy", "richot", "cicero", "magic times", "napoleon", "star brandy", "amadeus"],
    "Beers": ["beer", "pilsner", "guinness", "heineken", "white cap", "tusker", "summit", "balozi", "lion extra"],
    "Ciders": ["cider", "savanna", "snapp", "hunters", "manyatta"],
    "Beers-infusions": ["desparado", "ferari ice", "black ice", "kenya originals"],
    "Tequila": ["tequila", "olmeca", "jose cuervo", "camino"],
    "Rum": ["rum", "bacardi", "captain morgan", "old monk"],
    "Gin": ["gin", "beefeater", "gordons", "tanquery", "hendricks", "gilbeys", "caribia", "chrome gin", "best gin", "aspera", "avalon", "classic/tambuzi", "star gin", "q1"],
    "Soft-Drinks": ["soda", "water", "juice", "energy", "redbull", "monster", "novida", "bubble up", "delmonte", "bovinae", "power play", "bravado", "guarana", "lemonade", "club", "safari water", "seasons", "tumbler"],
    "Smokes": ["cig", "dunhill", "sportsman", "vape", "velo", "embassy", "pall mall"]
}

# Function to classify each product
def classify_product(name):
    lower_name = name.lower()
    for category, keywords in categories.items():
        if any(keyword in lower_name for keyword in keywords):
            return category
    return "Unclassified"

# Create dataframe
df = pd.DataFrame(products, columns=["Product Name"])
df["Category"] = df["Product Name"].apply(classify_product)

# Save to Excel
file_path = "classified_products.xlsx"
df.to_excel(file_path, index=False)

file_path
