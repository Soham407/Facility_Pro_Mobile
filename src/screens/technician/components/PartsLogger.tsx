import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Colors, Radius, FontSize, MIN_TOUCH_TARGET } from '../../../lib/constants';
import { Button } from '../../../components/ui/Button';

interface Part {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PartsLoggerProps {
  parts: Part[];
  onPartsChange: (parts: Part[]) => void;
  readonly?: boolean;
}

export function PartsLogger({ parts, onPartsChange, readonly = false }: PartsLoggerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState('1');

  const fetchProducts = async (query: string) => {
    setLoading(true);
    let q = supabase.from('products').select('*');
    if (query) {
      q = q.or(`product_name.ilike.%${query}%,product_code.ilike.%${query}%`);
    }
    const { data } = await q.limit(20);
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (modalVisible && !selectedProduct) {
      fetchProducts(search);
    }
  }, [search, modalVisible, selectedProduct]);

  const handleAddPart = () => {
    if (!selectedProduct) return;
    const qty = parseInt(quantity, 10) || 1;
    const price = selectedProduct.unit_price || 0;
    const newPart: Part = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.product_name,
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
    };
    onPartsChange([...parts, newPart]);
    setModalVisible(false);
    setSelectedProduct(null);
    setSearch('');
    setQuantity('1');
  };

  const handleRemovePart = (index: number) => {
    const newParts = [...parts];
    newParts.splice(index, 1);
    onPartsChange(newParts);
  };

  const totalCost = parts.reduce((acc, part) => acc + (part.total_price || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parts Used</Text>
        {!readonly && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={20} color={Colors.primary} />
            <Text style={styles.addText}>Add Part</Text>
          </TouchableOpacity>
        )}
      </View>

      {parts.length === 0 ? (
        <Text style={styles.emptyText}>No parts logged.</Text>
      ) : (
        <View style={styles.list}>
          {parts.map((p, i) => (
            <View key={i} style={styles.partItem}>
              <View style={styles.partInfo}>
                <Text style={styles.partName}>{p.product_name}</Text>
                <Text style={styles.partDetail}>Qty: {p.quantity} × ₹{(p.unit_price / 100).toFixed(2)}</Text>
              </View>
              <Text style={styles.partTotal}>₹{(p.total_price / 100).toFixed(2)}</Text>
              {!readonly && (
                <TouchableOpacity onPress={() => handleRemovePart(i)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Parts cost:</Text>
            <Text style={styles.totalValue}>₹{(totalCost / 100).toFixed(2)}</Text>
          </View>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedProduct ? 'Enter Quantity' : 'Select Product'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedProduct(null); }}>
                <Ionicons name="close" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedProduct ? (
              <View style={styles.qtyContainer}>
                <Text style={styles.selectedName}>{selectedProduct.product_name}</Text>
                <Text style={styles.selectedStock}>Available: {selectedProduct.current_stock} {selectedProduct.unit_of_measure}</Text>
                
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
                
                <Button title="Add to Job" onPress={handleAddPart} style={styles.submitBtn} />
                <Button title="Back" variant="ghost" onPress={() => setSelectedProduct(null)} />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search parts by name or code..."
                  placeholderTextColor={Colors.border}
                  value={search}
                  onChangeText={setSearch}
                />
                
                {loading ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
                ) : products.length === 0 ? (
                  <Text style={styles.noResults}>No parts found — contact supervisor to add to inventory</Text>
                ) : (
                  <FlatList
                    data={products}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.productRow} onPress={() => setSelectedProduct(item)}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.productName}>{item.product_name}</Text>
                          <Text style={styles.productCode}>{item.product_code}</Text>
                        </View>
                        <Text style={styles.productPrice}>₹{(item.unit_price / 100).toFixed(2)}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FontSize.cardTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: Radius.sm,
  },
  addText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyText: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  list: {
    gap: 12,
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSize.body,
  },
  partDetail: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    marginTop: 4,
  },
  partTotal: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    marginRight: 12,
  },
  removeBtn: {
    padding: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    color: Colors.textMuted,
    fontWeight: 'bold',
    fontSize: FontSize.body,
  },
  totalValue: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: FontSize.sectionTitle,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    minHeight: '60%',
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: FontSize.sectionTitle,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: 16,
    height: MIN_TOUCH_TARGET,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  noResults: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSize.body,
  },
  productCode: {
    color: Colors.textMuted,
    fontSize: FontSize.caption,
    marginTop: 2,
  },
  productPrice: {
    color: Colors.primaryLight,
    fontWeight: 'bold',
  },
  qtyContainer: {
    flex: 1,
  },
  selectedName: {
    fontSize: FontSize.sectionTitle,
    color: Colors.primaryLight,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedStock: {
    color: Colors.textMuted,
    marginBottom: 24,
  },
  label: {
    color: Colors.textMuted,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: 16,
    height: MIN_TOUCH_TARGET,
    color: Colors.textPrimary,
    marginBottom: 24,
    fontSize: 18,
  },
  submitBtn: {
    marginBottom: 12,
  },
});
