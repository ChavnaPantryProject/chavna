import * as React from "react";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_URL, Response, retrieveValue } from "./util";
import PopupForm, { PopupState } from "./PopupForm";
import { getTemplates } from "./select-template";
import { ScrollView } from "react-native-gesture-handler";

type GetCategoriesResponse = {
  categories: Array<string>
}

type Template = {
  id: string,
  name: string,
  amount: number,
  unit: string,
  shelfLifeDays: number,
  category: string
};

export type ConfirmationItem = {
  displayName: string | null,
  scanName: string,
  qty: number | null,
  price: number | null,
  template: Template | null
};

export default function ConfirmationScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ConfirmationItem[]>([]);

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [allValid, setAllValid] = useState(false);

  const [updateIndex, setUpdateIndex] = useState(-1);

  const [templates, setTemplates] = useState<Array<Template>>([])
  const [popupState, setPopupState] = useState<PopupState>({
      quantity:"",
      price: "",
      displayName: null,
      scanName: "New Item",
      template: null
  });

  const { scanItems } = useLocalSearchParams<{scanItems: string}>();

  useEffect(() => {
    (async () => {
      const scannedItems: ConfirmationItem[] = scanItems? JSON.parse(scanItems) : [];

      if (scannedItems.length == 0)
        return;

      const scanTexts = scannedItems.map(v => (v.scanName));

      const templates: Map<string, Template> = new Map((await getTemplates()).map(t => [t.id, t]));

      const jwt = await retrieveValue('jwt');
  
      if (jwt == null) {
        console.log("no jwt");
        return;
      }

      const response = await fetch(`${API_URL}/get-scan-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keys: scanTexts 
        })
      });

      type GetScanKeyResponse = {
        templateIds: any
      }

      const body: Response<GetScanKeyResponse> = await response.json();

      if (!response.ok || body.success !== "success") {
        console.log("get-scan-keys request failed: ", body);
        return;
      }

      const ids: Map<string, string> = new Map(Object.entries(body.payload?.templateIds));
      for (let item of scannedItems) {
        if (ids.has(item.scanName)) {
          const id = ids.get(item.scanName);
          const template = templates.get(id!);

          item.displayName = template!.name;
          item.template = template!;
        }
      }

      setItems(scannedItems);
    })();
  }, [scanItems])

  useEffect(() => {
    let noTemplate = false;

    for (const item of items) {
      if (item.template === null)
        noTemplate = true;
    }

    setAllValid(!noTemplate);
  }, [items]);

  const updateTemplates = async () => {
    type TemplatesResponse = {
      success: "success",
      status: 200,
      payload: Array<
        {
          templateId: string,
          template: {
            name: string,
            amount: number,
            unit: string,
            shelfLifeDays: number,
            category: string
          };
        }
      >
    };

    const token = await retrieveValue("jwt")
    if (!token) {
      console.error("No authentication token found")
      return
    }

    const response = await fetch(`${API_URL}/get-food-item-templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const body: TemplatesResponse = await response.json();

    if (response.ok && body.success === "success") {
      const payload = body.payload;
      
      setTemplates(payload.map(value => {
        let template = value.template as Template;
        template['id'] = value.templateId;

        return template as Template;
      }));
    }
  };

  useEffect(() => {
    updateTemplates();
  }, []);

  const saveItems = async () => {
    const token = await retrieveValue("jwt")
    if (!token) {
      console.error("No authentication token found")
      return
    }

    type Item = {
      templateId: string,
      amount: number,
      unitPrice: number
    }
    let addItems: Item[] = items.map((item) => {
      const actualAmount = item.template!.amount * item.qty!;
      return {
        templateId: item.template!.id,
        amount: actualAmount,
        unitPrice: item.price! / actualAmount
      }
    });

    const response = await fetch(`${API_URL}/add-food-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: addItems
      })
    });

    const body = await response.json();

    if (!response.ok || body.success === "fail")
      throw body;
  };

  const handleAddItem = (data: ConfirmationItem) => {
    if (updateIndex === -1)
      setItems((prev) => [...prev, data]);
    else {
      const nextItems = items.map((item, i) => {
        if (i === updateIndex) {
          return data;
        } else {
          return item;
        }
      });

      setItems(nextItems);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/scanner")}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Confirmation</Text>
      </View>

      {/* Middle Section (Soft Green) */}
      <ScrollView style={styles.content}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Name</Text>
          <Text style={styles.headerCell}>Qty</Text>
          <Text style={styles.headerCell}>Price</Text>
        </View>

        {items.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => {
              setUpdateIndex(index);
              setPopupState({
                quantity: item.qty? String(item.qty) : "",
                price: item.price? String(item.price) : "",
                displayName: item.displayName,
                scanName: item.scanName,
                template: item.template
              })
              setIsPopupVisible(true);
            }}
          >
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, item.template === null && {color: "#AAAAAA"}]}>{item.displayName ? item.displayName : item.scanName }</Text>
              <Text style={styles.tableCell}>{item.qty? item.qty : "-"}</Text>
              <Text style={styles.tableCell}>{item.price? item.price.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
              }) : "-"}</Text>
            </View>
          </Pressable>
        ))}

        {/* + Button */}
        <TouchableOpacity
          onPress={() => {
            setUpdateIndex(-1);
            setIsPopupVisible(true);
          }}>
          <Text style={styles.plusSign}>＋</Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Save Button */}
      <TouchableOpacity style={[styles.saveButton, (!allValid || items.length == 0) && {opacity: .5}]}
      disabled={!allValid || items.length == 0}
      onPress={() => {
        saveItems();
        router.push("/(tabs)/home");
      }}
      >
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      {/* Bottom White Section */}
      <View style={styles.bottomWhite} />
      <PopupForm
        visible={isPopupVisible}
        onClose={() => setIsPopupVisible(false)}
        onSave={handleAddItem} 
        onDelete={() => {
          setIsPopupVisible(false);
          
          if (updateIndex < 0)
            return;

          const newItems = items.filter((_, i) => i != updateIndex);
          setItems(newItems);
        }}
        /*
        onSubmit={(data) => {
          handleAddItem(data);      // add the returned data to the table
          setIsPopupVisible(false); // close the popup
        }}
          */
         state={popupState}
         setState={setPopupState}
         updateIndex={updateIndex}
        //title="Add Item"
      />
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White top
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#D6EAD8",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    left: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    backgroundColor: "#E8F3E8", // soft green
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: 10,
    marginBottom: 10,
    padding: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#D6EAD8",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
    color: "#2E4E3F",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
    color: "#333",
    fontSize: 14,
  },
  plusSign: {
    textAlign: "center",
    fontSize: 26,
    color: "#2E4E3F",
    marginVertical: 12,
    marginBottom: 40
  },
  saveButton: {
    alignSelf: "center",
    backgroundColor: "#F59A73",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginTop: "auto",
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  bottomWhite: {
    height: 40,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
